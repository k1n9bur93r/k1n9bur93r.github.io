import { dynPair } from './Pair.js';


export class dynNode
{
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
    #ChildNodes = new Array();
    #ParentNodes = undefined;
    #Pair = undefined
    #HtmlNode = undefined

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
    GetParent = () => this.#ParentNodes;
    HasParent = () => this.#ParentNodes != undefined ? true : false; 
    AddParent(parentDyn)
    {
        this.#ParentNodes = parentDyn;
    }
    //Child Methods
    GetChildren = () => this.#ChildNodes;
    HasChildren = () => this.#ChildNodes.length > 0 ? true : false;

    AddChild(dynNodeChild)
    {
        dynNode.VerifyDynNodeType(dynNodeChild);
        dynNodeChild.AddParent(this);
        this.#ChildNodes.push(dynNodeChild);
    }
    //Html Element Hook Related Methods 
    GetHook = () => this.#HtmlNode;
    // DynPair Related Methods 

    async SetDyn()
    { 
        this.#Pair = new dynPair();
        await this.#Pair.LoadPair(this.#HtmlNode,this)
    }

    GetDyn()
    {
        dynPair.VerifyDynPairType(this.#Pair);
        return this.#Pair;
    }
    GetRecord()
    {
        dynPair.VerifyDynPairType(this.#Pair);
        return this.#Pair.GetRecord();        
    }
    SetRecord(record)
    {
        dynPair.VerifyDynPairType(this.#Pair);
        return this.#Pair.SetRecord(record);        
    }
    GetPlate()
    {
        dynPair.VerifyDynPairType(this.#Pair);
        return this.#Pair.GetPlate();        
    }
    HasRecord = () => this.GetRecord() != undefined ? true : false;
    HasPlate = () => this.GetPlate() != undefined ? true : false;

    RenderNode(node)
    {
        let index = this.#Pair.GetIndex();
        if(index)
        {
            for (const property in this.GetRecord()[0]) {
                this.#Pair.Obj.props[property]=this.GetRecord()[index][property];
            }
                this.#HtmlNode.innerHTML=this.#Pair.Obj.RenderPlate();
        }
    }

     createNodeFromHTML(htmlString,getDyn = true) {
        const range = document.createRange();
        range.selectNode(document.body);
        const fragment = range.createContextualFragment(htmlString);
        const container = document.createElement('div');
        for(let frag of fragment.children)
        {
            if(frag.getAttribute('dyn') && getDyn)
            {
                container.appendChild(frag);
            }
        }
        return container.firstChild;
    }
}
