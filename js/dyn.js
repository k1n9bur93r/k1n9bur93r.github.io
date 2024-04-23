const Trees = [];

async function RecurseForDyns(htmlnode, currentNode = undefined) {
  if (htmlnode.nodeType === Node.ELEMENT_NODE) {
    if (htmlnode.hasAttribute('dyn')) {
      const newNode = new DynNode(htmlnode, currentNode);
      if (currentNode === undefined) {
        Trees.push(newNode);
      }
      await newNode.LoadNoad();
      currentNode = newNode;
    }
  }
  for (let i = 0; i < htmlnode.children.length; i++) {
    await RecurseForDyns(htmlnode.children[i], currentNode);
  }
}

async function BootStrapDyn() {
  await RecurseForDyns(document.documentElement);
}
document.addEventListener('DOMContentLoaded', BootStrapDyn);

class DynPlate {
  PlateObj = {
    Props: [], RecordDepth: undefined, Template: '', Render: '',
  };

  PlateSubDyn = [];

  #PlateKey = undefined;

  #CreatePlateObjItem = (propValue, recordIndex) => ({
    value: propValue, isArray: false, arrayValues: [], recordIndexPath: recordIndex,
  });

  RenderPlate(arrayPropIndex) {
    let plateToRender = this.PlateObj.Template;
    Object.entries(this.PlateObj.Props).forEach(([propName, propValue]) => {
      if (typeof propValue.value === 'object') {
        console.warn("Can't bind an object to a plate");
      }
      plateToRender = plateToRender.replace(
        new RegExp(`{{${propName}}}`, 'g'),
        propValue.isArray ? propValue.arrayValues[arrayPropIndex] : propValue.value,
      );
    });
    this.PlateObj.Render = plateToRender;
  }

  BindRecordToProps(record, recordIndices) {
    for (const propertyString in this.PlateObj.Props) {
      const properties = propertyString.split('.');
      let y = 0;
      let result = record;
      for (let i = 0; i < properties.length; i) {
        const property = properties[i];
        if (Array.isArray(result)) {
          result = result[recordIndices[y]];
          y++;
        } else {
          result = result[property];
          i++;
        }
        if (result === undefined || result === null) {
          break; // throw and error here
        }
      }
      if (Array.isArray(result)) {
        this.PlateObj.Props[propertyString].arrayValues = result;
        this.PlateObj.Props[propertyString].isArray = true;
      }
      this.PlateObj.Props[propertyString].value = result;
    }
  }

  async ParsePlate(htmlElement) {
    if (htmlElement.hasAttribute('plate')) {
      const externalPlate = await new DynStream(htmlElement.getAttribute('plate'), DynStreamTypes.PLATE).Get();
      htmlElement.innerHTML = externalPlate;
    }
    this.#PlateKey = this.GenerateGUID();
    await this.#ParsePlateForProps(htmlElement);
    this.PlateObj.Template = htmlElement.innerHTML;
    htmlElement.innerHTML = '';
  }

  async #ParsePlateForProps(parentElement) {
    let hasDyn = false;
    for (let i = 0; i < parentElement.childNodes.length; i++) {
      const childHtmlNode = parentElement.childNodes[i];

      if (childHtmlNode.nodeType === 1) {
        if (childHtmlNode.hasAttribute('dyn')) {
          hasDyn = true;
          childHtmlNode.innerText.match(/{{.*\..*}}/) ? childHtmlNode.setAttribute('recordIndex', '') : undefined;
          childHtmlNode.setAttribute('plateindex', `${this.PlateSubDyn.length}`);
          childHtmlNode.setAttribute('key', this.#PlateKey);
          this.PlateSubDyn.push(childHtmlNode.cloneNode(true));
          childHtmlNode.innerHTML = '';
        } else if (!await this.#ParsePlateForProps(childHtmlNode) && childHtmlNode.innerText && childHtmlNode.innerText.match(/^{{([^\}]+)}}$/)) {
          const text = childHtmlNode.innerText.match(/\{\{(.*?)\}\}/)[1].trim();
          const hasExistingProp = this.PlateObj.Props[text] !== undefined;
          this.PlateObj.Props[text] = hasExistingProp ? this.PlateObj.Props[text] : [];
          const hasRecordDepth = this.PlateObj.RecordDepth !== undefined;
          this.PlateObj.RecordDepth = hasRecordDepth ? this.PlateObj.RecordDepth : text;
          this.PlateObj.Props[text].push(this.#CreatePlateObjItem(text, childHtmlNode.getAttribute('recordIndex')));
        }
      }
    }
    return hasDyn;
  }

  GenerateGUID() {
    return 'xxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

class DynPair {
  #Rules = new DynRules();

  #Plate = new DynPlate();

  #Record = new DynRecord(this.#Rules);

  async CreatePair(htmlNode) {
    await this.#Record.ParseRecord(htmlNode);
    await this.#Plate.ParsePlate(htmlNode);
    await this.#RenderPair(htmlNode);
  }

  async #RenderPair(htmlElement) {
    const getIndex = this.#Rules.CheckDynValue(htmlElement.getAttribute('dyn'));
    const indexToLoopOn = htmlElement.hasAttribute('recordIndex') ? htmlElement.getAttribute('recordIndex').split(',') : [];
    const recordLevel = this.#Record.GetRecordLoopingLength(this.#Plate.PlateObj.RecordDepth, indexToLoopOn);
    const indexs = getIndex(htmlElement.getAttribute('dyn'), recordLevel);

    for (let i = 0; i < indexs.length; i++) {
      const recordIndices = htmlElement.hasAttribute('recordIndex') ? htmlElement.getAttribute('recordIndex').split(',') : [];
      recordIndices.push(indexs[i]);
      const plateCopy = document.createElement('div');
      plateCopy.id = `${this.#Plate.GenerateGUID()}#${indexs[i]}`;
      this.#Plate.BindRecordToProps(this.#Record.Record, recordIndices);
      this.#Plate.RenderPlate(indexs[i]);
      plateCopy.innerHTML = this.#Plate.PlateObj.Render;

      plateCopy.querySelectorAll('[recordIndex]').forEach((dyn) => {
        dyn.getAttribute('key') == this.#Plate.PlateKey ? dyn.setAttribute('recordIndex', dyn.getAttribute('recordIndex').concat(recordIndices)) : null;
      });
      htmlElement.appendChild(plateCopy);
    }

    for (let index = 0; index < this.#Plate.PlateSubDyn.length; index++) {
      htmlElement.querySelectorAll(`[plateindex="${index}"]`).forEach((dyn) => {
        dyn.innerHTML = this.#Plate.PlateSubDyn[index].innerHTML;
      });
    }
  }
}

class DynRecord {
  Record = undefined;

  #Rules = undefined;

  constructor(rules) {
    this.#Rules = rules;
  }

  async ParseRecord(htmlElement) {
    let postLoadAtn = (record) => {
      let parsedRecord = JSON.parse(record);
      if (!Array.isArray(parsedRecord)) {
        parsedRecord = [parsedRecord];
      }
      return parsedRecord;
    };
    if (this.#Rules.CheckFuncExists(htmlElement, 'shape')) {
      postLoadAtn = window[htmlElement.getAttribute('shape')];
    }
    if (this.#Rules.CheckServerPath(htmlElement.getAttribute('record'))) {
      this.Record = await new DynStream(htmlElement.getAttribute('record'), DynStreamTypes.RECORD).Get(postLoadAtn);
    } else if (window[htmlElement.getAttribute('record')]) {
      this.Record = postLoadAtn(window[htmlElement.getAttribute('record')]);
    }
  }

  GetRecordLoopingLength(recordPath, recordIndices) {
    if (recordIndices.length == 0) {
      return this.Record;
    }

    const properties = recordPath.split('.');
    let result = this.Record;
    properties.forEach((property) => {
      if (Array.isArray(result)) {
        if (recordIndices.length === 0) {
          throw new Error(`No indices provided for array access in '${recordPath}'`);
        }
        const index = recordIndices.shift();
        result = result[index];
      } else {
        result = result[property];
      }
      if (result === undefined || result === null) {
        throw new Error(`Record structure does not match with provided path '${recordPath}', indices '${recordIndices}'`);
      }
    });

    return result;
  }
}

class DynNode {
  #ParentNodes = undefined;

  #ChildNodes = [];

  #Pair = new DynPair();

  #HtmlNode = undefined;

  constructor(htmlNode, parentNode = undefined) {
    if (parentNode) {
      if (!htmlNode.hasAttribute('record')) {
        htmlNode.setAttribute('record', parentNode.GetHook().getAttribute('record'));
      }
      parentNode.AddChild(this);
      this.AddParent(parentNode);
    }
    this.#HtmlNode = htmlNode;
  }

  LoadNoad() {
    this.#Pair.CreatePair(this.#HtmlNode);
  }

  AddParent(parentDyn) {
    this.#ParentNodes = parentDyn;
  }

  AddChild(dynNodeChild) {
    dynNodeChild.AddParent(this);
    this.#ChildNodes.push(dynNodeChild);
  }
}

const DynStreamTypes = {
  RECORD: 0,
  PLATE: 1,
  DYN: 3,
};

class DynStream {
  static CachedStreams = new Map();

  constructor(source, typeId) {
    this.StreamType = this.#GetType(typeId);
    this.Source = source;
  }

  #Type = (Name, Id) => ({ Name, Id });

  #GetType(typeId) {
    const foundType = this.#StreamType.find((type) => type.Id == typeId);

    if (!foundType) {
      throw new Error('Invalid Dyn Stream. Unkown Type Id was supplied to Dyn stream.');
    }
    return foundType;
  }

  #StreamType = [this.#Type('Record', DynStreamTypes.RECORD), this.#Type('Plate', DynStreamTypes.PLATE), this.#Type('Dyn', DynStreamTypes.DYN)];

  Stream = () => DynStream.CachedStreams.get(this.Source);

  async #WaitTillFetched(key) {
    while (true) {
      const value = DynStream.CachedStreams.get(key);
      if (value !== 'fetching') {
        return value;
      }
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
  }

  async Get(postFetchActn = (streamArg) => streamArg) {
    if (this.Stream()) {
      await this.#WaitTillFetched(this.Source);
      return this.Stream();
    }
    DynStream.CachedStreams.set(this.Source, 'fetching');

    return fetch(this.Source)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Invalid Stream Path. Failed to fetch ${this.StreamType.Name} from supplied path '${this.Source}'`);
        }
        return response.text();
      })
      .then((stream) => {
        const modifiedStream = postFetchActn(stream);
        DynStream.CachedStreams.set(this.Source, modifiedStream);
        return this.Stream();
      });
  }
}

class DynRules {
  #Bind = new DynBind();

  #ServerPath = /^(.+)\/([^\/]+)$/;

  #Loop = /^(?:\d+|n(?:-\d+)?)\.{3}(?:\d+|n(?:-\d+)?)$/;

  #Index = /^(?:\d+|n(?:-\d+)?)$/;

  #WhiteSpace = /^\s*$/;

  #isWhitespace(str = ' ') {
    return this.#WhiteSpace.test(str);
  }

  CheckDynValue(dynAttributeValue) {
    switch (true) {
      case dynAttributeValue === '':
      {
        return (value, record) => [0];
        // break;
      }
      case this.#ServerPath.test(dynAttributeValue):
      {
        return undefined;
        // break;
      }
      case this.#Loop.test(dynAttributeValue):
      {
        return this.#Bind.BindLoop.bind(this.#Bind);
        // break;
      }
      case this.#Index.test(dynAttributeValue):
      {
        return this.#Bind.BindIndex.bind(this.#Bind);
        // break;
      }
      default:
      {
        throw Error(`Invalid value in element's Dyn attribute. Cannot be matched to a valid pattern '${dynAttributeValue}'.`);
      }
    }
  }

  CheckServerPath(recordAttributeValue) {
    return this.#ServerPath.test(recordAttributeValue);
  }

  CheckDynServerAttributes(htmlElement) {
    // we will need to do something a bit different here in terms of import and validation
    // I dont think we want any records, internal or external plates for these divs
  }

  CheckFuncExists(htmlElement, attributeToCheck) {
    if (!htmlElement.hasAttribute(attributeToCheck)) {
      return false;
    }
    const funcName = htmlElement.getAttribute(attributeToCheck);
    if (!window[funcName]) {
      // implement this
      console.warn(`%cWARNING: Referenced function does not exist for Dyn attribute action,${funcName} will be evaluated as a bool conditional.`, 'font-weight: bold; color: Orange;');
      return false;
    }
    return true;
  }

  CheckDynHasPlate(htmlElement, localPlate) {
    if (htmlElement.hasAttribute('plate') && !this.#isWhitespace(localPlate)) {
      throw Error(`Plate binding conflict. Dyns with an external Plate must not have an internal Plate. Element must have an empty inner HTML '${localPlate}' `);
    }

    if (!htmlElement.hasAttribute('plate') && this.#isWhitespace(localPlate)) {
      throw Error('Empty Plate binding. Dyn has no external Plate or internal Plate. Dyn needs a Plate attribute or an inner HTML to bind too.');
    }
  }
}
class DynBind {
  #PerformNCalculation(number, nMath) {
    const nCalc = nMath.replace(/n/g, number);
    return Number(eval(nCalc));
  }

  BindLoop(dynAtrValue, record) {
    const splitArray = dynAtrValue.split('...');
    let startIndex = splitArray[0];
    let endIndex = splitArray[1];
    const indexes = new Array();
    let reverseOrder = false;

    startIndex = this.#GetNValue(startIndex, record);
    endIndex = this.#GetNValue(endIndex, record);
    if (startIndex > endIndex) {
      reverseOrder = true;
    }

    if (startIndex > record.length
            || endIndex > record.length) {
      throw new Error('Invalid index range specified for loop statement in dyn attribute. The starting or ending index ');
    }
    if (!reverseOrder) {
      for (let index = startIndex; index <= endIndex; index++) {
        indexes.push(index);
      }
    } else {
      for (let index = startIndex; index >= endIndex; index--) {
        indexes.push(index);
      }
    }
    return indexes;
  }

  BindIndex(dynAtrValue, dynRecord) {
    if (isNaN(dynAtrValue)) {
      dynAtrValue = this.#GetNValue(dynAtrValue, dynRecord);
    }

    if (isNaN(dynAtrValue) && (dynAtrValue < 0 || dynAtrValue > dynRecord.length)) {
      throw new Error('Invalid index specified ');
    }
    return [dynAtrValue];
  }

  //   BindPath() {
  //     // maybe we can return a new stream here that we then call the dyn walk through,
  // and pass it in a tree and node?
  //   }

  #GetNValue(value, dynRecord) {
    if (value.length !== 1) {
      value = this.#PerformNCalculation(dynRecord.length - 1, value);
    } else if (value === 'n') {
      value = dynRecord.length - 1;
    } else {
      value = Number(value);
    }
    return value;
  }
}
