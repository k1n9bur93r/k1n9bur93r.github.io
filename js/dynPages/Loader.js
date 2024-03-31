import { dynNode } from "./Node.js";

export class Dyn
{
    #Trees = new Array(); 
    static toRender = new Array();

     async RecurseForDyns(htmlnode, currentNode = undefined) 
     {
        if (htmlnode.nodeType === Node.ELEMENT_NODE) {
            if(htmlnode.hasAttribute('dyn'))
            {
                let newNode = new dynNode(htmlnode,currentNode);
                if (currentNode == undefined)
                {
                    this.#Trees.push(newNode);
                }
                await newNode.SetDyn();
                currentNode = newNode;
            }

            }    
            for (let i = 0; i < htmlnode.children.length; i++) {
                await this.RecurseForDyns(htmlnode.children[i],currentNode);
            }
        }

    async InitDynPages()
    {
        await this.RecurseForDyns(document.documentElement);
    }

}