import { dynNode } from './Node.js';
import { dynTree } from './Tree.js';
import { dynStream } from './Stream.js';
import { dynPair } from './Pair.js';

document.addEventListener("DOMContentLoaded", BootStrapDyn);
async function BootStrapDyn()
{
    let masterDyn = new Dyn();
   await masterDyn.InitalizeDynApp();
}
export class Dyn
{
    #trees = new Array();
    #dynNodes = undefined;
    #dyns = {}
    #plateStreams = {}
    #recordStreams = {}
    

     async traverseForDynTrees(htmlnode, currentNode = undefined,currentTree = undefined) {
        let childDyn= undefined;
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

    
    
    // Call traverseForDynTrees with the document root node on init 
    //traverseForDynTrees(document.documentElement);


    async InitalizeDynApp()
    {
        await this.traverseForDynTrees(document.documentElement);

    }
    async #RenderDyn(dynPairs, index=-1)
    {   
        // So far the creation process would be 
        // Scan page for all Dyns
        /////META there will be some soupness to the steps here, if we know the tree shape we can put in place holders for the external dyns 
        ///// we want to do as much of our loading as we can all at once so we are not blocked by anything
        // start verifying that the html attributes are valid 
        // Run through external dyns and load them into a hash table
        // fetch external dyns, process and loop till al dyns are accounted for
        // Run through all external plates and records, load them into a hash table 
        // build dynStreams->dynPairs->dynNodes->dynTree
        /// while this is happening the dynStreams will be fetching their contents async 
        //load up records, external plates
        // while that is going on verify if funcs within morphs and show's exist 
        // determine which elements from a record will be visible based on nodes and loops 
        // begin combining loaded records and plates to dynPairs
        // run the record scoping method to supply records to children dyns that need the data 
        // run through the dyn tree to show/eject elemtns from the tree
        // start to render the tree, iterate through and run render steps on each node 
        // run records through their morph methods if applicable 
        // run  plate to show/eject elements from the plate
        // we should be good?




        //if only dyn attr exists then use parent record and plate, parent record needs plate
        //if only dyn attr exists and has a name then check for named variable to place MAYBE DO THIS THIS FEELS COMPLEX 
        //if dyn and plate then use the plate within the dyn
        //if dyn and record exist then must be at least one child dyn to act as local plate 
        //if dyn ,record, and plate exist then use them all within the dyn
        //if dyn attr has no value just append all children 
        //if dyn has number with dot then prop name then use that property
        //OR dyn has prop attr
        //if dyn attr has just an number then scope to that index
        //if dyn attr has a #...# where # is a number or n then that loop over that subset
        //if dyn has a path in it then create and scope to a new dyn container (like a plate but with all the other logic) 

        //if there is a morph name then send the current value/index/collection through the function, these functions can modify or expand the object
        

        for(let pair of dynPairs)
        {
            //I want to create a tree based representation of the dyn which is then used to verify 

            //check for every dyn
            // if the dyn doe not have a child dyn, and has a plate attribute then load the plate into the dyn and bind to all availabe data
            //if the dyn does have a child dyn, and has a plate attribute then apply the plate to any child dyns that have no inner html value
            // if the dyn does not have a child dyn, then we can assume everything in the dyn is a local plate
            //if the dyn does have a child dyn then we will scope any record down to apply to those child dyns
            ////Maybe we can try sub scoping things? 
            //if a dyn has a value, does not start with a number , then we can assume it is the path to load in another dyn page

            //the following need to pass a check for having a record bound to the dyn
            //if the dyn does start with a number and has a '...' inside of it then we need to itterate over the record and binding each item to the plate
            // if the dyn does start with a number and does not have a '...' inside of it then we need to bind the item at the index to the plate, throw error if it does not exist 
            //if the dyn has a value, it must not be    
            //fetch every dyn with a record since we need data to bind to a plate
            //if there is no plate in the record within it, then we just assume  that the inside of the dyn is the template 
            //a dyn represents the pair of a plate and record we should bind to 

            // let dynIndex = index != -1? index : Number(recordValue.split('.')[0]);
            // let dynrecordName = recordValue.split('.')[1];
            
            // if (!isNaN(recordValue)) //if there is a plate in the dyn
            // {
            //     if(localplate)
            //     {
            //         element.appendChild(this.#RenderElement([localplate]))
            //     }
            //     else
            //     {
            //         element.appendChild(this.#dynElements[dynIndex].Element);
            //     }
            // }
            // else if(this.#dynElements[0].record.hasOwnProperty(dynrecordName)) //if there is a single prop in the item
            // {
            //     element.innerText = this.#dynElements[dynIndex].record[dynrecordName];
            // }
            // else if(recordValue[0]=="?")
            // {

            //     let expressionResult = ((expression) => {
            //         try {
            //           const safeEval = eval;
            //           return safeEval(expression);
            //         } catch (error) {
            //           console.error("Error evaluating expression:", error);
            //           return undefined; // or handle the error as needed
            //         }
            //       })(recordValue.slice(1));

            // }
            // else if(recordValue.split('...').length > 1)
            // {
            //     let splitArray = recordValue.split('...')
            //     let startIndex= splitArray[0];
            //     let endIndex = splitArray[1];
            //     if(endIndex == 'n')
            //     {
            //         endIndex = this.#dynElements.length;
            //     }
            //     for(let index = startIndex;index<endIndex;index++)
            //     {
            //         if(localplate)
            //         {
            //             element.appendChild(this.#RenderElement([localplate],index))
            //         }
            //         else
            //         {
            //             element.appendChild(this.#dynElements[dynIndex].Element);
            //         }
            //     }
            // }
        }
    }

    #generateGUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
    }

}

