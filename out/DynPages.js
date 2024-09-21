// dyn/DynAlias.ts
class DynAlias {
  static StreamAliases = new Map;
  static FetchOrSetAliasIfApplicable(streamPath) {
    if (DynAlias.HasAliasInPath(streamPath)) {
      let alias = "";
      [streamPath, alias] = DynAlias.ExtractStreamAlias(streamPath);
      DynAlias.SetStreamAlias(streamPath, alias);
    }
    if (DynAlias.HasAlias(streamPath)) {
      streamPath = DynAlias.GetStreamFromAlias(streamPath);
    }
    return streamPath;
  }
  static HasAliasInPath(streamPath) {
    return streamPath.includes(" as ");
  }
  static HasAlias(alias) {
    return this.StreamAliases.has(alias);
  }
  static ExtractStreamAlias(streamPath) {
    return streamPath.split(" as ");
  }
  static SetStreamAlias(streamPath, userAlias) {
    this.StreamAliases.set(userAlias, streamPath);
  }
  static GetStreamFromAlias(userAlias) {
    const result = this.StreamAliases.get(userAlias);
    if (!result) {
      throw new Error(`Alias '${userAlias}' not found`);
    }
    return result;
  }
}

// dyn/DynStream.ts
class DynStream {
  static CachedStreams = new Map;
  Source;
  CurrentType;
  constructor(source, typeId) {
    this.CurrentType = this.GetType(typeId);
    this.Source = source;
  }
  Type = (Name, Id) => ({ Name, Id });
  GetType(typeId) {
    const foundType = this.StreamTypes.find((type) => type.Id === typeId);
    if (!foundType) {
      throw new Error("Invalid Dyn Stream. Unknown Type Id was supplied to Dyn stream.");
    }
    return foundType;
  }
  StreamTypes = [
    this.Type("Record", 0 /* RECORD */),
    this.Type("Plate", 1 /* PLATE */),
    this.Type("Dyn", 3 /* DYN */)
  ];
  Stream = () => DynStream.CachedStreams.get(this.Source);
  async WaitTillFetched(key) {
    while (true) {
      const value = DynStream.CachedStreams.get(key);
      if (value !== "fetching") {
        return value;
      }
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
  }
  async Get(postFetchActn = (streamArg) => streamArg) {
    if (this.Stream()) {
      await this.WaitTillFetched(this.Source);
      return this.Stream();
    }
    DynStream.CachedStreams.set(this.Source, "fetching");
    return fetch(this.Source).then((response) => {
      if (!response.ok) {
        throw new Error(`Invalid Stream Path. Failed to fetch ${this.CurrentType.Name} from supplied path '${this.Source}'`);
      }
      return response.text();
    }).then((stream) => {
      const modifiedStream = postFetchActn(stream);
      DynStream.CachedStreams.set(this.Source, modifiedStream);
      return this.Stream();
    });
  }
}

// dyn/DynPlate.ts
class DynPlate {
  PlateObj = {
    Props: {},
    RecordDepth: undefined,
    Template: "",
    Render: ""
  };
  PlateSubDyn = [];
  PlateKey = undefined;
  CreatePlateObjItem = (propValue, recordIndex) => ({
    value: propValue,
    isArray: false,
    arrayValues: [],
    recordIndexPath: recordIndex
  });
  RenderPlate(arrayPropIndex) {
    let plateToRender = this.PlateObj.Template;
    Object.entries(this.PlateObj.Props).forEach(([propName, propValue]) => {
      if (typeof propValue.value === "object") {
        console.warn("Can't bind an object to a plate");
      }
      plateToRender = plateToRender.replace(new RegExp(`{{${propName}}}`, "g"), propValue.isArray ? propValue.arrayValues[arrayPropIndex] : propValue.value);
    });
    this.PlateObj.Render = plateToRender;
  }
  BindRecordToProps(record, recordIndices) {
    let boundProps = false;
    for (const propertyString in this.PlateObj.Props) {
      boundProps = true;
      const properties = propertyString.split(".");
      let y = 0;
      let result = record;
      for (let i = 0;i < properties.length; ) {
        const property = properties[i];
        if (Array.isArray(result)) {
          result = result[recordIndices[y]];
          y++;
        } else {
          result = result[property];
          i++;
        }
        if (result === undefined || result === null) {
          break;
        }
      }
      if (Array.isArray(result)) {
        this.PlateObj.Props[propertyString].arrayValues = result;
        this.PlateObj.Props[propertyString].isArray = true;
      }
      this.PlateObj.Props[propertyString].value = result;
    }
    return boundProps;
  }
  async ParsePlate(htmlElement) {
    let plateAttributeValue = htmlElement.getAttribute("plate");
    if (plateAttributeValue) {
      plateAttributeValue = DynAlias.FetchOrSetAliasIfApplicable(plateAttributeValue);
      if (plateAttributeValue[0] === "#") {
        const template = document.querySelector(plateAttributeValue);
        if (template) {
          template.style.display = "none";
          htmlElement.innerHTML = template.innerHTML;
        }
      } else {
        htmlElement.innerHTML = await new DynStream(plateAttributeValue, 1 /* PLATE */).Get();
      }
    }
    this.PlateKey = this.GenerateGUID();
    await this.ParsePlateForProps(htmlElement);
    this.PlateObj.Template = htmlElement.innerHTML;
    htmlElement.innerHTML = "";
  }
  async ParsePlateForProps(parentElement) {
    let hasDyn = false;
    if (typeof parentElement === "string") {
      const container = document.createElement("div");
      container.innerHTML = parentElement;
      parentElement = container;
    }
    for (let i = 0;i < parentElement.childNodes.length; i++) {
      const childHtmlNode = parentElement.childNodes[i];
      if (childHtmlNode.nodeType === 1) {
        if (childHtmlNode.hasAttribute("dyn")) {
          hasDyn = true;
          childHtmlNode.innerText.match(/{{.*\..*}}/) && childHtmlNode.setAttribute("recordIndex", "");
          childHtmlNode.setAttribute("plateindex", `${this.PlateSubDyn.length}`);
          childHtmlNode.setAttribute("key", this.PlateKey || "");
          this.PlateSubDyn.push(childHtmlNode.cloneNode(true));
          childHtmlNode.innerHTML = "";
        } else if (!await this.ParsePlateForProps(childHtmlNode) && childHtmlNode.innerText && childHtmlNode.innerText.match(/^{{([^\}]+)}}$/)) {
          const text = childHtmlNode.innerText.match(/\{\{(.*?)\}\}/)?.[1].trim() || "";
          const hasExistingProp = this.PlateObj.Props[text] !== undefined;
          this.PlateObj.Props[text] = hasExistingProp ? this.PlateObj.Props[text] : this.CreatePlateObjItem(text, childHtmlNode.getAttribute("recordIndex") || "");
          const hasRecordDepth = this.PlateObj.RecordDepth !== undefined;
          this.PlateObj.RecordDepth = hasRecordDepth ? this.PlateObj.RecordDepth : text;
        }
      }
    }
    return hasDyn;
  }
  GenerateGUID() {
    return "xxxxxxxx".replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === "x" ? r : r & 3 | 8;
      return v.toString(16);
    });
  }
}

// dyn/DynRecord.ts
class DynRecord {
  Record = undefined;
  Rules;
  constructor(rules) {
    this.Rules = rules;
  }
  async ParseRecord(htmlElement) {
    let postLoadAtn = (record) => {
      let parsedRecord = JSON.parse(record);
      if (!Array.isArray(parsedRecord)) {
        parsedRecord = [parsedRecord];
      }
      return parsedRecord;
    };
    let postAtnFilter = (record) => record;
    let preFilteredRecord;
    if (this.Rules.CheckFuncExists(htmlElement, "shape")) {
      const shapeAttr = htmlElement.getAttribute("shape");
      if (shapeAttr) {
        postLoadAtn = window[shapeAttr];
      }
    }
    if (this.Rules.CheckFuncExists(htmlElement, "filter")) {
      const filterAttr = htmlElement.getAttribute("filter");
      if (filterAttr) {
        postAtnFilter = window[filterAttr];
      }
    }
    const recordAttr = htmlElement.getAttribute("record");
    if (!recordAttr) {
      throw new Error("Record attribute is missing");
    }
    let recordAttributeValue = DynAlias.FetchOrSetAliasIfApplicable(recordAttr);
    if (this.Rules.CheckServerPath(recordAttributeValue)) {
      preFilteredRecord = await new DynStream(recordAttributeValue, 0 /* RECORD */).Get(postLoadAtn);
    } else {
      preFilteredRecord = window[`${recordAttributeValue}`];
      if (!preFilteredRecord) {
        throw new Error("A valid server location or window bound JS object was not set for the Plate");
      }
    }
    this.Record = postAtnFilter(preFilteredRecord);
  }
  GetRecordLoopingLength(recordPath, recordIndices) {
    if (recordIndices.length === 0) {
      return this.Record;
    }
    const properties = recordPath.split(".");
    let result = this.Record;
    properties.forEach((property) => {
      if (Array.isArray(result)) {
        if (recordIndices.length === 0) {
          throw new Error(`No indices provided for array access in '${recordPath}'`);
        }
        const index = recordIndices.shift();
        if (index !== undefined) {
          result = result[index];
        }
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

// dyn/DynBind.ts
class DynBind {
  PerformNCalculation(number, nMath) {
    const nCalc = nMath.replace(/n/g, number.toString());
    return Number(eval(nCalc));
  }
  BindLoop(dynAtrValue, record) {
    const splitArray = dynAtrValue.split("...");
    let startIndex = this.GetNValue(splitArray[0], record);
    let endIndex = this.GetNValue(splitArray[1], record);
    const indexes = [];
    let reverseOrder = false;
    if (startIndex > endIndex) {
      reverseOrder = true;
    }
    if (startIndex > record.length || endIndex > record.length) {
      throw new Error("Invalid index range specified for loop statement in dyn attribute. The starting or ending index ");
    }
    if (!reverseOrder) {
      for (let index = startIndex;index <= endIndex; index++) {
        indexes.push(index);
      }
    } else {
      for (let index = startIndex;index >= endIndex; index--) {
        indexes.push(index);
      }
    }
    return indexes;
  }
  BindIndex(dynAtrValue, dynRecord) {
    let value = this.GetNValue(dynAtrValue, dynRecord);
    if (isNaN(value) || (value < 0 || value > dynRecord.length)) {
      throw new Error("Invalid index specified ");
    }
    return [value];
  }
  GetNValue(value, dynRecord) {
    if (value.length !== 1) {
      return this.PerformNCalculation(dynRecord.length - 1, value);
    } else if (value === "n") {
      return dynRecord.length - 1;
    } else {
      return Number(value);
    }
  }
}

// dyn/DynRules.ts
class DynRules {
  Bind = new DynBind;
  ServerPath = /^(.+)\/([^\/]+)$/;
  Loop = /^(?:\d+|n(?:-\d+)?)\.{3}(?:\d+|n(?:-\d+)?)$/;
  Index = /^(?:\d+|n(?:-\d+)?)$/;
  WhiteSpace = /^\s*$/;
  isWhitespace(str = " ") {
    return this.WhiteSpace.test(str);
  }
  CheckDynValue(dynAttributeValue) {
    switch (true) {
      case dynAttributeValue === "":
        return (value, record) => [0];
      case this.ServerPath.test(dynAttributeValue):
        return;
      case this.Loop.test(dynAttributeValue):
        return this.Bind.BindLoop.bind(this.Bind);
      case this.Index.test(dynAttributeValue):
        return this.Bind.BindIndex.bind(this.Bind);
      default:
        throw Error(`Invalid value in element's Dyn attribute. Cannot be matched to a valid pattern '${dynAttributeValue}'.`);
    }
  }
  CheckServerPath(recordAttributeValue) {
    return this.ServerPath.test(recordAttributeValue);
  }
  CheckDynServerAttributes(htmlElement) {
  }
  CheckFuncExists(htmlElement, attributeToCheck) {
    if (!htmlElement.hasAttribute(attributeToCheck)) {
      return false;
    }
    const funcName = htmlElement.getAttribute(attributeToCheck);
    if (funcName && !window[funcName]) {
      console.warn(`%cWARNING: Referenced function does not exist for Dyn attribute action,${funcName} will be evaluated as a bool conditional.`, "font-weight: bold; color: Orange;");
      return false;
    }
    return true;
  }
  CheckDynHasPlate(htmlElement, localPlate) {
    if (htmlElement.hasAttribute("plate") && !this.isWhitespace(localPlate)) {
      throw Error(`Plate binding conflict. Dyns with an external Plate must not have an internal Plate. Element must have an empty inner HTML '${localPlate}' `);
    }
    if (!htmlElement.hasAttribute("plate") && this.isWhitespace(localPlate)) {
      throw Error("Empty Plate binding. Dyn has no external Plate or internal Plate. Dyn needs a Plate attribute or an inner HTML to bind too.");
    }
  }
}

// dyn/DynPair.ts
class DynPair {
  Rules = new DynRules;
  Plate = new DynPlate;
  Record;
  constructor() {
    this.Record = new DynRecord(this.Rules);
  }
  async CreatePair(htmlNode) {
    await this.Record.ParseRecord(htmlNode);
    await this.Plate.ParsePlate(htmlNode);
    await this.RenderPair(htmlNode);
  }
  async RenderPair(htmlElement) {
    const dynAttr = htmlElement.getAttribute("dyn");
    if (!dynAttr) {
      throw new Error("Dyn attribute is missing");
    }
    const getIndex = this.Rules.CheckDynValue(dynAttr);
    if (!getIndex) {
      throw new Error("Invalid dyn attribute value");
    }
    const recordIndexAttr = htmlElement.getAttribute("recordIndex");
    const indexToLoopOn = recordIndexAttr ? recordIndexAttr.split(",").map(Number) : [];
    const recordLevel = this.Record.GetRecordLoopingLength(this.Plate.PlateObj.RecordDepth || "", indexToLoopOn);
    const indexs = getIndex(dynAttr, recordLevel);
    const parser = new DOMParser;
    for (let i = 0;i < indexs.length; i++) {
      const recordIndices = recordIndexAttr ? recordIndexAttr.split(",").map(Number) : [];
      recordIndices.push(indexs[i]);
      this.Plate.BindRecordToProps(this.Record.Record, recordIndices);
      this.Plate.RenderPlate(indexs[i]);
      let plateCopy = parser.parseFromString(this.Plate.PlateObj.Render, "text/html");
      let plateCopyElement;
      plateCopyElement = plateCopy.children[0].children[1].children.length === 1 ? plateCopy.children[0].children[1].firstChild : plateCopy.children[0].children[1];
      if (plateCopyElement) {
        plateCopyElement.id = `${this.Plate.GenerateGUID()}#${indexs[i]}`;
        plateCopyElement.querySelectorAll("[recordIndex]").forEach((dyn) => {
          if (dyn instanceof HTMLElement && dyn.getAttribute("key") === this.Plate.PlateKey) {
            dyn.setAttribute("recordIndex", (dyn.getAttribute("recordIndex") || "").concat(recordIndices.join(",")));
          }
        });
        htmlElement.appendChild(plateCopyElement);
      }
    }
    for (let index = 0;index < this.Plate.PlateSubDyn.length; index++) {
      htmlElement.querySelectorAll(`[plateindex="${index}"]`).forEach((dyn) => {
        if (dyn instanceof HTMLElement) {
          dyn.innerHTML = this.Plate.PlateSubDyn[index].innerHTML;
        }
      });
    }
  }
}

// dyn/DynNode.ts
class DynNode {
  ParentNode;
  ChildNodes = [];
  Pair = new DynPair;
  HtmlNode;
  constructor(htmlNode, parentNode) {
    if (parentNode) {
      parentNode.AddChild(this);
      this.AddParent(parentNode);
    }
    this.HtmlNode = htmlNode;
    if (!this.HtmlNode.getAttribute("record")) {
      const parentScopedRecord = this.SearchUpForNearestRecord();
      this.HtmlNode.setAttribute("record", parentScopedRecord[0]);
      if (parentScopedRecord[1]) {
        this.HtmlNode.setAttribute("shape", parentScopedRecord[1]);
      }
      if (parentScopedRecord[2]) {
        this.HtmlNode.setAttribute("filter", parentScopedRecord[2]);
      }
    }
  }
  LoadNoad() {
    if (this.HtmlNode.getAttribute("dyn") !== "") {
      this.Pair.CreatePair(this.HtmlNode);
    }
  }
  AddParent(parentDyn) {
    this.ParentNode = parentDyn;
  }
  AddChild(dynNodeChild) {
    dynNodeChild.AddParent(this);
    this.ChildNodes.push(dynNodeChild);
  }
  SearchUpForNearestRecord() {
    const isRecordEmptyOrSpaces = (attributeValue) => attributeValue === null || attributeValue.match(/^ *$/) !== null;
    let parentNodeToSearch = this.ParentNode;
    do {
      if (!parentNodeToSearch) {
        throw new Error("Dyn was not supplied a Record and no other Records were found higher up the dyn tree scope.");
      }
      const possibleNodeRecord = parentNodeToSearch.HtmlNode.getAttribute("record");
      const possibleNodeShape = parentNodeToSearch.HtmlNode.getAttribute("shape");
      const possibleNodeFilter = parentNodeToSearch.HtmlNode.getAttribute("filter");
      if (possibleNodeRecord && !isRecordEmptyOrSpaces(possibleNodeRecord)) {
        return [possibleNodeRecord, possibleNodeShape, possibleNodeFilter];
      }
      parentNodeToSearch = parentNodeToSearch.ParentNode;
    } while (true);
  }
}

// dyn/DynPages.ts
async function RecurseForDyns(htmlnode, currentNode) {
  if (htmlnode.nodeType === Node.ELEMENT_NODE && htmlnode instanceof HTMLElement) {
    if (htmlnode.hasAttribute("dyn")) {
      const newNode = new DynNode(htmlnode, currentNode);
      if (currentNode === undefined) {
        Trees.push(newNode);
      }
      await newNode.LoadNoad();
      currentNode = newNode;
    }
  }
  for (let i = 0;i < htmlnode.childNodes.length; i++) {
    await RecurseForDyns(htmlnode.childNodes[i], currentNode);
  }
}
async function BootStrapDyn() {
  await RecurseForDyns(document.documentElement);
}
var Trees = [];
document.addEventListener("DOMContentLoaded", BootStrapDyn);

//# debugId=0AC80871532C40B664756E2164756E21
//# sourceMappingURL=DynPages.js.map
