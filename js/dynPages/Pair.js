import { dynStream, dynStreamTypes } from "./Stream.js";
import { dynRules } from "./Rules.js";

export class dynPair {
    #Rules = new dynRules();
    #Record = undefined;
    #Plate = undefined;
    #PlateSubDyn = new Array();
    #LocalKey = undefined;
    #InheritedPlate = false;

#CreatePlateObj = () =>({
    props: [], 
    localRecord : undefined,
    recordDepth : undefined,
    recordIndex : undefined,
    plateTemplate: "",
    plate: "",
    SetPlateValue: function(record,recordIndices) {
        for (let propertyString in this.props) {
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
                this.props[propertyString].arrayValues = result;
                this.props[propertyString].isArray = true;
            }
            this.props[propertyString].value = result;  
        }
    },
    RenderSection: function(arrayPropIndex){
        let plateToRender = this.plateTemplate;
        for (const [propName] of Object.entries(this.props)) {
            if( typeof this.props[propName].value == "object")
            {
                console.warn("Can't bind an object to a plate")
            }
            plateToRender = plateToRender.replace(new RegExp(`{{${propName}}}`, 'g'), 
            this.props[propName].isArray ? this.props[propName].arrayValues[arrayPropIndex] :this.props[propName].value);
        };
        this.plate = plateToRender;
        return this.plate;
    }
});
Obj  = this.#CreatePlateObj()

GetLoopingIndex(record,recordPath,recordIndices)
{
    let properties = recordPath.split('.');
    let y = 0;
    let result = record;
    let lastLevel = 0;
    for (let i = 0; i < properties.length; i) {
        var property = properties[i];
        if (Array.isArray(result)) {
            if(y == recordIndices.length)
            {
                return result;
            }
            result = result[recordIndices[y]];
            y++;
        } else {
            result = result[property];
            i++;
        }
        if (result === undefined || result === null) {
            break; //throw an error here 
        }
    }
    return result;
}

async LoadPair(htmlElement) {
    await this.#ParseRecord(htmlElement);
    await this.#ParsePlate(htmlElement);
    await this.#RenderDyn(htmlElement);

}

static VerifyDynPairType(objectToCheck) {
    if (!objectToCheck instanceof dynPair) {
        throw Error('Object is not of type dynPair');
    }
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
    this.#Record = await new dynStream(htmlElement.getAttribute('record'), dynStreamTypes.RECORD).Get(postLoadAtn);
}

#RenderDyn = async (htmlElement) => {
    let getIndex = this.#Rules.CheckDynValue(htmlElement.getAttribute('dyn'));
    let indexToLoopOn = [];
    let recordLevel = this.#Record;
    if(htmlElement.hasAttribute('recordIndex')  )
    {
        indexToLoopOn = htmlElement.getAttribute('recordIndex').split(',');
        recordLevel = this.GetLoopingIndex(this.#Record,this.Obj.recordDepth,indexToLoopOn);
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
        let isArray = this.Obj.SetPlateValue(this.#Record,recordIndices);
        plateCopy.innerHTML = this.Obj.RenderSection(indexs[i]);
        plateCopy.querySelectorAll(`[recordIndex]`).forEach(dyn =>{
            if(dyn.getAttribute('key') == this.#LocalKey)
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
    this.#LocalKey = this.#generateGUID();
    await this.TraverseHTMLForPlatePropBindings(htmlElement,this.Obj);
    this.Obj.plateTemplate = htmlElement.innerHTML;
    htmlElement.innerHTML = "";
}

async TraverseHTMLForPlatePropBindings(parentElement, plateObj)
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
                childHtmlNode.setAttribute('key',this.#LocalKey);
                this.#PlateSubDyn.push(childHtmlNode.cloneNode(true));
                childHtmlNode.innerHTML = "";
            } 
            else 
            {
                let dynChildFound = await this.TraverseHTMLForPlatePropBindings(childHtmlNode,plateObj);
                if (!dynChildFound) 
                {
                    if (childHtmlNode.innerText && childHtmlNode.innerText.includes("{{") && childHtmlNode.innerText.includes("}}") && childHtmlNode.innerText.match(/\{\{(.*?)\}\}/g).length == 1) 
                    {
                        
                        const text = childHtmlNode.innerText.match(/\{\{(.*?)\}\}/)[1].trim();
                        if(plateObj.props[text] == undefined)
                        {
                            plateObj.props[text] = new Array();
                        }
                        if(plateObj.recordDepth == undefined)
                        {
                            plateObj.recordDepth = text;
                        }
                        plateObj.props[text].push({value:text,isArray:false,arrayValues:[],recordIndexPath:childHtmlNode.getAttribute('recordIndex')});  
                    }
                }
            }
        }
    }
    return hasDyn;
}

    SetRecord = (newRecord, inherited = true) => {
        this.#Record = newRecord
        this.#InheritedPlate = inherited;
    }

    IsPlateInherited = () => this.#InheritedPlate;
    GetRecord = () => this.#Record;

    GetPlate = () => this.#Plate
    SetPlate = (value) => {
        this.#Plate = value
    };

    #generateGUID() {
        return 'xxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

}
