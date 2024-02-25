import { dynPair } from './Pair.js';
import { dynRules } from './Rules.js';

export class dynNode
{
    #Rules = new dynRules();
    constructor(domHook)
    {
        //need to figure out how this part will work, probably can do some async stuff that happens in the BG as the tree is built? 
        //this.#Dyn = dynPair;
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
       
        

        //we check if there is a morph, if there is then we make a new deep copy of our record and set it back to the plate,
        //then we can check the show action to see if we even need to render the tree
        /// ------IDEA to establish an order of operations we can stub out some code for dynExt we can give create different kinds of steps load, render, post render and then give an int to represent ordering
        // we can look at what is inside of the dyn to build the JSON object we want to represent with our HTML (primarily if we are doing a single object, full list, or partial list)
        // we can then start making the object based on the list
        //the simple part here would be doing the thing where we bind items to props, but we probably need to do a bit more here first 
    
}

//random ideas for extensions
//dynAnim - cascading animations based on tree shape or some other things 
//dynSelect - tools for parsing the dynTree to create custom sub trees of nodes
//dynState - system for maintaing updates to dyn records (advanced) or at least ways to rerender subsections of the trees based on button clicks or somethin
//dynGrid - this feels mostly like CSS stuff, could be neat if smart enough, but we don't want to make a bunch of wrappers for existing stuff
//dynDebug - I want to make this, but i want there to be some cool things that devs can use to vizualize the dyn tree and other things 