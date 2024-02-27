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
        let firstChild = this.#DomHook.firstChild;
        recordsToBind.forEach(record =>{

            for (const property in record) {
                this.#Dyn.Obj.props[property]=record[property];
            }
            let platePart = this.#Dyn.Obj.RenderPlate();
            var plate = document.createElement('div');
            plate.innerHTML=platePart;
            dynContent.appendChild(plate);
        })
   
        this.#DomHook.insertBefore(dynContent,firstChild);
    }
}
