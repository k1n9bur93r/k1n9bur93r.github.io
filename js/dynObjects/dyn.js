import { dynNode } from './Node.js';
import { dynTree } from './Tree.js';


document.addEventListener("DOMContentLoaded", BootStrapDyn);
async function BootStrapDyn()
{
    let masterDyn = new Dyn();
   await masterDyn.InitalizeDynApp();
}
export class Dyn
{
    #trees = new Array();

     async traverseForDynTrees(htmlnode, currentNode = undefined,currentTree = undefined) {
        if (htmlnode.nodeType === Node.ELEMENT_NODE) {
            if(htmlnode.hasAttribute('dyn'))
            {
                let newNode = new dynNode(htmlnode);
                if (currentTree == undefined)
                {
                    currentTree = new dynTree();
                    currentTree.SetRoot(newNode);
                    this.#trees.push(currentTree);
                    currentNode = currentTree.GetTree();
                }
                else
                {
                    await currentTree.SetChild(currentNode,newNode);
                    currentNode = newNode;
                }
                
            }    
            for (let i = 0; i < htmlnode.childNodes.length; i++) {
                await this.traverseForDynTrees(htmlnode.childNodes[i],currentNode,currentTree);
            }
        }
    }

    async InitalizeDynApp()
    {
        await this.traverseForDynTrees(document.documentElement);
    }

    #generateGUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
    }

}

