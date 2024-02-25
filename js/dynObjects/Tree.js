import { dynNode } from './Node.js';
import { dynRules } from './Rules.js';

export class dynTree{

    #dynRules = new dynRules();
    #Tree = undefined;
    #RecordScopes = new Array();
    #NonAccountedLeafs = new Array();


    constructor()
    {

    }

    //Primary Setters and Getters

    GetTree = () => this.#Tree;

    async SetRoot(rootNode)
    {
        this.#Tree =  rootNode;    
        let node = await this.#Tree.SetDyn(); 
        this.#ProcessNodeEvents(node)
    }

    async SetChild(parentNode,childNode)
    {
        parentNode.AddChild(childNode);
        let node = await childNode.SetDyn();
        this.#ProcessNodeEvents(node)   
    }

    #ProcessNodeEvents(loadedNode)
    {
        if(!loadedNode.HasRecord())
        {
            let parentNode = loadedNode;

            do
            {
                parentNode = parentNode.GetParent();
                loadedNode.SetRecord(parentNode.GetRecord())
            }while ((!parentNode.HasRecord() || parentNode.GetDyn().IsPlateInherited()) && parentNode.GetParent() != undefined )
            if(this.#RecordScopes.find(scope => scope.root == parentNode))
            {
                this.#RecordScopes.find(scope => scope.root == parentNode).children.push(loadedNode);
            }
            else
            {
                this.#NonAccountedLeafs.push({leaf:loadedNode,recordRoot:parentNode});
            }
        }
        else if(loadedNode.HasRecord())
        {
            this.#RecordScopes.push(this.#CreateSelection(loadedNode));
            let foundLeafs = new Array();
            for(let node of this.#NonAccountedLeafs)
            {
                if(this.#RecordScopes.find(scope => scope.root == node.recordRoot))
                {
                    this.#RecordScopes.find(scope => scope.root == node.recordRoot).children.push(node.leaf);
                    foundLeafs.push(node);
                }
            }
            this.#NonAccountedLeafs = this.#NonAccountedLeafs.filter(node =>!foundLeafs.includes(node));

        }
        loadedNode.RenderNode();
        console.log(this.#RecordScopes);
        console.log(this.#NonAccountedLeafs);
    }


    GetRecordScopes = () => this.#RecordScopes;

    RenderTree()
    {
        //traverse down the tree and render each item
    }

    //Debugs tools 

    PrintTree = () => this.#dfs(this.#Tree);

    //Internal Helper Methods 

    #dfs(node, condFunc = () => true, condAction = this.#Print) 
    {
        let condReturn = undefined;
        if (condFunc(node))
        {
           condReturn = condAction(node);
        } 
        node.GetChildren().forEach(child => {
                this.#dfs(child, condFunc.bind(this), this.#CurryCondAction(condAction.bind(this),condReturn).bind(this));
        });
    }
  
  // Generic DFS Action Methods 

    #CreateSelection(selectionParent)
    {
        return {root : selectionParent, children : new Array(),scopeId:0};
    }
    

    #CurryCondAction(action, ...args) {
        return function(node) {
            return action(node, ...args);
        }
    }
    
    #Print = (node) => {
        console.table(node.GetDyn());
    }
        
}