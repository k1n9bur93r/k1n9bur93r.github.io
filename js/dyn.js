document.addEventListener("DOMContentLoaded", BootStrapDyn);

let Trees = new Array(); 

async function RecurseForDyns(htmlnode, currentNode = undefined) 
{
   if (htmlnode.nodeType === Node.ELEMENT_NODE) {
       if(htmlnode.hasAttribute('dyn'))
       {
           let newNode = new dynNode(htmlnode,currentNode);
           if (currentNode == undefined)
           {
               Trees.push(newNode);
           }
           await newNode.SetDyn();
           currentNode = newNode;
       }

       }    
       for (let i = 0; i < htmlnode.children.length; i++) {
           await RecurseForDyns(htmlnode.children[i],currentNode);
       }
}

async function BootStrapDyn()
{
    await RecurseForDyns(document.documentElement);
}




 class dynNode
{
    #Pair = undefined
    #HtmlNode = undefined

    constructor(htmlNode,parentNode = undefined)
    {
        if(parentNode)
        {
            if(!htmlNode.hasAttribute('record'))
            {
                htmlNode.setAttribute('record',parentNode.GetHook().getAttribute('record'));
            }
            dynNode.VerifyDynNodeType(parentNode);
            parentNode.AddChild(this);
            this.AddParent(parentNode);
        }
        this.#HtmlNode= htmlNode;
    }

    async SetDyn()
    { 
        this.#Pair = new dynPair();
        await this.#Pair.LoadPair(this.#HtmlNode,this)
    }
}
 class dynPair {
    #Rules = new dynRules();
    #Record = undefined;
    #PlateObj = {Props: [], RecordDepth : undefined, Template: "",Render: "",};
    #PlateSubDyn = new Array();
    #PlateKey = undefined;

    static VerifyDynPairType(objectToCheck) {
        if (!objectToCheck instanceof dynPair) {
            throw Error('Object is not of type dynPair');
        }
    }

    async LoadPair(htmlElement) {
        await this.#ParseRecord(htmlElement);
        await this.#ParsePlate(htmlElement);
        await this.#RenderDyn(htmlElement);
    }

#CreatePlateObjItem = (propValue,recordIndex) => ({value:propValue,isArray:false,arrayValues:[],recordIndexPath:recordIndex});

RenderPlate (arrayPropIndex, plateObj) 
{
    let plateToRender = plateObj.Template;
    for (const [propName] of Object.entries(plateObj.Props)) {
        if( typeof plateObj.Props[propName].value == "object")
        {
            console.warn("Can't bind an object to a plate")
        }
        plateToRender = plateToRender.replace(new RegExp(`{{${propName}}}`, 'g'), 
        plateObj.Props[propName].isArray ? plateObj.Props[propName].arrayValues[arrayPropIndex] : plateObj.Props[propName].value);
    };
    plateObj.Render = plateToRender;
}

BindRecordToProps (plateObj, record, recordIndices) 
{
    for (let propertyString in plateObj.Props) {
        let properties = propertyString.split('.');
        let y = 0;
        let result = record;
        for (let i = 0; i < properties.length; i) {
            var property = properties[i];
            if (Array.isArray(result)) {
                result = result[recordIndices[y]];
                y++;
            } else {
                result = result[property];
                i++;
            }
            if (result === undefined || result === null) {
                break; //throw and error here 
            }
        }
        if(Array.isArray(result))
        {
            plateObj.Props[propertyString].arrayValues = result;
            plateObj.Props[propertyString].isArray = true;
        }
        plateObj.Props[propertyString].value = result;  
    }
}

#GetRecordLoopingLength(record, recordPath, recordIndices) {
    const properties = recordPath.split('.');
    let result = record;

    properties.forEach(property => {
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


async #ParseRecord(htmlElement) {
    let postLoadAtn = (record) => {

        let parsedRecord = JSON.parse(record)
        if(!Array.isArray(parsedRecord))
        {
            parsedRecord = [parsedRecord];
        }
        return parsedRecord;
    }
    if (this.#Rules.CheckFuncExists(htmlElement, 'shape')) {
        postLoadAtn = window[htmlElement.getAttribute('shape')];
    }
    if( this.#Rules.CheckServerPath(htmlElement.getAttribute('record')))
    {
        this.#Record = await new dynStream(htmlElement.getAttribute('record'), dynStreamTypes.RECORD).Get(postLoadAtn);
    }
    else if (window[htmlElement.getAttribute('record')])
    {
        this.#Record = postLoadAtn(window[htmlElement.getAttribute('record')]);
    }
}

#RenderDyn = async (htmlElement) => {
    let getIndex = this.#Rules.CheckDynValue(htmlElement.getAttribute('dyn'));
    let indexToLoopOn = [];
    let recordLevel = this.#Record;
    if(htmlElement.hasAttribute('recordIndex')  )
    {
        indexToLoopOn = htmlElement.getAttribute('recordIndex').split(',');
        recordLevel = this.#GetRecordLoopingLength(this.#Record,this.#PlateObj.RecordDepth,indexToLoopOn);
    }
    let indexs = getIndex(htmlElement.getAttribute('dyn'), recordLevel);
    for(let i =0; i < indexs.length;i++)
    {
        let recordIndices =[];
        if(htmlElement.hasAttribute('recordIndex'))
        { 
            recordIndices = htmlElement.getAttribute('recordIndex').split(',');
        }
        recordIndices.push(indexs[i]);
        let plateCopy = document.createElement('div');
        plateCopy.id = `${this.#generateGUID()}#${indexs[i]}`;
        this.BindRecordToProps(this.#PlateObj,this.#Record,recordIndices);
        this.RenderPlate(indexs[i],this.#PlateObj);
        plateCopy.innerHTML = this.#PlateObj.Render;
        plateCopy.querySelectorAll(`[recordIndex]`).forEach(dyn =>{
            if(dyn.getAttribute('key') == this.#PlateKey)
            {
                dyn.setAttribute('recordIndex', dyn.getAttribute('recordIndex').concat(recordIndices))
            }
        })
        htmlElement.appendChild(plateCopy);
    }
    
    for(let index = 0; index < this.#PlateSubDyn.length;index++)
    {
       let foundDyns = htmlElement.querySelectorAll(`[plateindex="${index}"]`);

       foundDyns.forEach(dyn =>{
        dyn.innerHTML = this.#PlateSubDyn[index].innerHTML;
       });

    }
}

async #ParsePlate(htmlElement) 
{
    if (htmlElement.hasAttribute('plate')) 
    {
        let externalPlate = await new dynStream(htmlElement.getAttribute('plate'), dynStreamTypes.PLATE).Get()
        htmlElement.innerHTML = externalPlate;
    }
    this.#PlateKey = this.#generateGUID();
    await this.#ParsePlateForProps(htmlElement,this.#PlateObj);
    this.#PlateObj.Template = htmlElement.innerHTML;
    htmlElement.innerHTML = "";
}

async #ParsePlateForProps(parentElement, plateObj)
{
    let hasDyn = false;
    for (let i = 0; i < parentElement.childNodes.length; i++) {
        const childHtmlNode = parentElement.childNodes[i];

        if (childHtmlNode.nodeType === 1) 
        {
            if (childHtmlNode.hasAttribute('dyn')) 
            {
                hasDyn = true;
                if(childHtmlNode.innerText.match(/{{.*\..*}}/))
                {
                    childHtmlNode.setAttribute('recordIndex','');
                }
                childHtmlNode.setAttribute('plateindex', `${this.#PlateSubDyn.length}`);
                childHtmlNode.setAttribute('key',this.#PlateKey);
                this.#PlateSubDyn.push(childHtmlNode.cloneNode(true));
                childHtmlNode.innerHTML = "";
            } 
            else 
            {
                let dynChildFound = await this.#ParsePlateForProps(childHtmlNode,plateObj);
                if (!dynChildFound) 
                {
                    if (childHtmlNode.innerText && childHtmlNode.innerText.includes("{{") && childHtmlNode.innerText.includes("}}") && childHtmlNode.innerText.match(/\{\{(.*?)\}\}/g).length == 1) 
                    {
                        const text = childHtmlNode.innerText.match(/\{\{(.*?)\}\}/)[1].trim();
                        if(plateObj.Props[text] == undefined)
                        {
                            plateObj.Props[text] = new Array();
                        }
                        if(plateObj.RecordDepth == undefined)
                        {
                            plateObj.RecordDepth = text;
                        }
                        plateObj.Props[text].push(this.#CreatePlateObjItem(text,childHtmlNode.getAttribute('recordIndex')));  
                    }
                }
            }
        }
    }
    return hasDyn;
}

#generateGUID() {
    return 'xxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

}
const dynStreamTypes = {
    RECORD: 0,
    PLATE: 1,
    DYN: 3
};
 class dynStream
{
    static CachedStreams = new Map();
    constructor(source,typeId)
    {

        this.StreamType = this.#GetType(typeId);
        this.Source=source;
    }

    #Type = (Name,Id) => ({Name:Name,Id:Id});

    #GetType(typeId)
    {
        const foundType = this.#StreamType.find(type => type.Id == typeId);

        if(!foundType)
        {
            throw new Error("Invalid Dyn Stream. Unkown Type Id was supplied to Dyn stream.")
        }
        return foundType;
    }

    #StreamType = [this.#Type("Record",dynStreamTypes.RECORD),this.#Type("Plate",dynStreamTypes.PLATE),this.#Type("Dyn",dynStreamTypes.DYN)]

    Stream = () =>  dynStream.CachedStreams.get(this.Source); 

    async #WaitTillFetched(key) {
        while (true) {
          const value = dynStream.CachedStreams.get(key);
          if (value !== 'fetching') {
            return value;
          }
          await new Promise(resolve => setTimeout(resolve, 5));
        }
      }

    async Get(postFetchActn = (streamArg) => streamArg)
    {
        if(this.Stream())
        {
            await this.#WaitTillFetched(this.Source)
            return this.Stream(); 
        }
        dynStream.CachedStreams.set(this.Source,'fetching');

        return await fetch(this.Source)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Invalid Stream Path. Failed to fetch ${this.StreamType.Name} from supplied path '${this.Source}'`);
            }
            return response.text()})
        .then(stream => { 
           let modifiedStream= postFetchActn(stream);
            dynStream.CachedStreams.set(this.Source,modifiedStream);
            return this.Stream();
        });

    }

}
 class dynRules 
{
    #Actions = new dynActions();
    #ServerPath = /^(.+)\/([^\/]+)$/;
    #Loop = /^(?:\d+|n(?:-\d+)?)\.{3}(?:\d+|n(?:-\d+)?)$/;
    #Index = /^(?:\d+|n(?:-\d+)?)$/;
    #WhiteSpace = /^\s*$/;

    #isWhitespace(str = " ") {
        return this.#WhiteSpace.test(str);
    }

    CheckDynValue(dynAttributeValue)
    {;
        //These can either return some kind of true, but would be cooler if they could return an action to take? 
        switch(true)
        {
            case dynAttributeValue == "":
                {
                    return   (value, record)=> [0];
                    //break;
                }
            case this.#ServerPath.test(dynAttributeValue):
                {
                    //need to figure out how to do this part, I will probs need at least one extra thing then gotta spin out 
                    return undefined
                    //break;
                }
            case this.#Loop.test(dynAttributeValue):
                {
                    return this.#Actions.BindLoop.bind(this.#Actions);
                    //break;
                }
            case this.#Index.test(dynAttributeValue):
                {
                    return this.#Actions.BindIndex.bind(this.#Actions)
                    //break;
                }
            default:
                {
                    throw Error (`Invalid value in element's Dyn attribute. Cannot be matched to a valid pattern '${dynAttributeValue}'.`);
                }
        }
    }

    CheckServerPath(recordAttributeValue)
    {
        return this.#ServerPath.test(recordAttributeValue);
    }

    CheckDynServerAttributes(htmlElement)
    {
       // we will need to do something a bit different here in terms of import and validation 
       //I dont think we want any records, internal or external plates for these divs 
    }

    CheckFuncExists(htmlElement,attributeToCheck)
    {
        if( !htmlElement.hasAttribute(attributeToCheck))
        {
            return false;
        }
        const funcName = htmlElement.getAttribute(attributeToCheck);
        if(!window[funcName])
        {
            // implement this 
            console.warn(`%cWARNING: Referenced function does not exist for Dyn attribute action,${funcName} will be evaluated as a bool conditional.`, 'font-weight: bold; color: Orange;')
            return false;
        }
        return true; 
    }

    CheckDynHasPlate(htmlElement,localPlate)
    {
        if (htmlElement.hasAttribute('plate') && !this.#isWhitespace(localPlate))
        {
            throw Error (`Plate binding conflict. Dyns with an external Plate must not have an internal Plate. Element must have an empty inner HTML '${localPlate}' `)
        }

        if(!htmlElement.hasAttribute('plate') && this.#isWhitespace(localPlate))
        {
            throw Error ('Empty Plate binding. Dyn has no external Plate or internal Plate. Dyn needs a Plate attribute or an inner HTML to bind too.')
        }

    }
}
class dynActions
{
    BindLoop(dynAtrValue,record)
    {
        let splitArray = dynAtrValue.split('...')
        let startIndex= splitArray[0];
        let endIndex = splitArray[1];
        let indexes = new Array();
        let reverseOrder = false;

            startIndex = this.#GetNValue(startIndex,record);
            endIndex = this.#GetNValue(endIndex,record);
        if(startIndex > endIndex)
        {
            reverseOrder = true;
        }

        if(startIndex > record.length
            || endIndex > record.length)
            {
                throw new Error("Invalid index range specified for loop statement in dyn attribute. The starting or ending index ");
            }
        if(!reverseOrder)
        {
            for(let index = startIndex; index<=endIndex; index++)
            {
                indexes.push(index)
            }
        }
        else
        {
            for(let index = startIndex; index>=endIndex; index--)
            {
                indexes.push(index)
            }
        }
        return  indexes
    }

    BindIndex(dynAtrValue, dynRecord)
    {
        if(isNaN(dynAtrValue))
        {
            dynAtrValue = this.#GetNValue(dynAtrValue,dynRecord);
        }

        if(isNaN(dynAtrValue) && dynAtrValue < 0 || dynAtrValue > dynRecord.length)
        {
            throw new Error("Invalid index specified ");
        }
        return [dynAtrValue]
    }

    BindPath()
    {
        //maybe we can return a new stream here that we then call the dyn walk through, and pass it in a tree and node? 
    }
    
    #GetNValue(value, dynRecord)
    {
        if(value.length != 1)
        {
            value = this.#PerformNCalculation(dynRecord.length-1,value);

        }
        else if (value == "n")
        {
            value = dynRecord.length-1; 
        }
        else
        {
            value = Number(value);
        }
        return value;
    }

    #PerformNCalculation(number, nMath) {
        var nCalc = nMath.replace(/n/g, number);    
        return Number(eval(nCalc));
    }
    GetIteration = (dynAtrValue, record) =>
    ({ action:dynAtrValue,iter:this.#GeIterationFromBindOrIndex(dynAtrValue)})

    #GeIterationFromBindOrIndex(dynAtrValue)
    {
        if(dynAtrValue.includes('...'))
        {
            let start = dynAtrValue.split('...')[0];
            let end = dynAtrValue.split('...')[1];
            if(start.length == 1)
            {
                if(isNaN(start))
                {
                    start = 0
                }
            }
            else
            {
                start = this.#PerformNCalculation(0,start);   
            }
            if(end.length == 1)
            {
                if(isNaN(end))
                {
                    end = 0
                }
            }
            else
            {
                end = this.#PerformNCalculation(0,end);   
            }
            return Math.abs(Math.abs(start)-Math.abs(end));
        }
        else
        {
            if(isNaN(dynAtrValue))
            {
                return 1
            }
            return dynAtrValue;
        }
    }
}
