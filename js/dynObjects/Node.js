import { dynPair } from './Pair.js';
import { dynRules } from './Rules.js';

export class dynNode
{
    #Rules = new dynRules();
    constructor(domHook)
    {
        this.#DomHook= domHook;
        this.#DynAction = this.#Rules.CheckDynValue(domHook);
    }
    #ChildDyns = new Array();
    #ParentDyn = undefined;
    #Dyn = undefined
    #DomHook = undefined
    #DynAction = undefined;

    // Private Helper Methods

    static VerifyDynNodeType(objectToCheck)
    {
        if(!objectToCheck instanceof dynNode)
        {
            throw Error('Unexpected Object type provided when pairing DynNode to DynTree.');
        }
    }
    //DynNode Related Methods
    //Parent Methods
    GetParent = () => this.#ParentDyn;
    HasParent = () => this.#ParentDyn != undefined ? true : false; 
    AddParent(parentDyn)
    {
        this.#ParentDyn = parentDyn;
    }
    //Child Methods
    GetChildren = () => this.#ChildDyns;
    HasChildren = () => this.#ChildDyns.length > 0 ? true : false;

    AddChild(dynNodeChild)
    {
        dynNode.VerifyDynNodeType(dynNodeChild);
        dynNodeChild.AddParent(this);
        this.#ChildDyns.push(dynNodeChild);
    }
    //Html Element Hook Related Methods 
    GetHook = () => this.#DomHook;
    // DynPair Related Methods 

    async SetDyn()
    { 
        this.#Dyn = new dynPair();
        await this.#Dyn.LoadPair(this.#DomHook)
        return this;
    }

    GetDyn()
    {
        dynPair.VerifyDynPairType(this.#Dyn);
        return this.#Dyn;
    }
    GetRecord()
    {
        dynPair.VerifyDynPairType(this.#Dyn);
        return this.#Dyn.GetRecord();        
    }
    SetRecord(record)
    {
        dynPair.VerifyDynPairType(this.#Dyn);
        return this.#Dyn.SetRecord(record);        
    }
    GetPlate()
    {
        dynPair.VerifyDynPairType(this.#Dyn);
        return this.#Dyn.GetPlate();        
    }
    HasRecord = () => this.GetRecord() != undefined ? true : false;
    HasPlate = () => this.GetPlate() != undefined ? true : false;

    RenderNode()
    {
        console.log("RENDERING")
        let recordsToBind = new Array();
        if(this.#DynAction)
        {
            recordsToBind = this.#DynAction(this.#DomHook.getAttribute("dyn"),this.GetRecord());
        }
        else
        {
            recordsToBind = this.GetRecord();
        }

        let dynContent = document.createDocumentFragment();
        for(let record of recordsToBind)
        {
            var plate = document.createElement('div');
            plate.innerHTML = this.GetPlate();
            let props = plate.querySelectorAll('[prop]');
            for(var prop of props)
            {
                let name= prop.getAttribute('prop');
                if(record[name] == undefined)
                {
                    console.warn(`Plate has no Prop associated with Record Property ${name}`);
                }
                let value = record[name];
                prop.textContent= value;
            }
            dynContent.appendChild(plate)
        }
        let firstChild = this.#DomHook.firstChild;
        this.#DomHook.insertBefore(dynContent,firstChild);
    }
}
