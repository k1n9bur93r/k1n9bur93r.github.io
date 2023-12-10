import { dynObject } from './dyn.js';
import { dynElement } from './Element.js';

export class dynContainer
{

    constructor(dataUrl,dataObject,elementUrl,templateUrl)
    {
        this.#containerTemplate= new dynObject(templateUrl,false);
        this.#dynData = new dynObject(dataUrl,true);
        this.#dataObject = dataObject;
        this.#dynTemplate = new dynObject(elementUrl,false);
        this.Container = undefined;


    }
    #dynElements = new Array();
    #dynData;
    #dynTemplate;
    #containerTemplate
    #dataObject;


    async FetchDyns()
    {
        const template = await this.#containerTemplate.GetStream();
        const data = await this.#dynData.GetStream();
        const element = await this.#dynTemplate.GetStream();
        this.#dynData =data;
        this.containerTemplate = template;
        this.#dynTemplate = element;
        if(this.#dataObject)
        {
            this.#dynData= this.#dataObject.SourceParser(this.#dynData);
        }
        for(let data of this.#dynData)
        {
            this.#dynElements.push(new dynElement(data,this.#dynTemplate))
        }    
        this.Container =  await this.#RenderTemplate();

       return await this.#PopulateContainer();
    }
    async #PopulateContainer()
    {
        console.log(this.Container);
        let elements = this.Container.querySelectorAll('[data]');
        for(let element of elements)
        {
            let dataValue = element.getAttribute('data');
            let isElement =  Number(dataValue) ;
            let isLoop= false;
            isLoop= dataValue.split('...').length > 1;
            let dynIndex = Number(dataValue.split('.')[0]);
            let dynDataName = dataValue.split('.')[1];

            
            if (!isNaN(dataValue))
            {
                element.appendChild(this.#dynElements[dynIndex].Element);
            }
            else if(this.#dynElements[0].Data.hasOwnProperty(dynDataName))
            {
                element.innerText = this.#dynElements[dynIndex].Data[dynDataName];
            }
            else if(isLoop)
            {
                let splitArray = dataValue.split('...')
                let startIndex= splitArray[0];
                let endIndex = splitArray[1];
                if(endIndex == 'n')
                {
                    endIndex = this.#dynElements.length;
                }
                for(let index = startIndex;startIndex<endIndex;startIndex++)
                {
                    //var nodes = document.createElement('div');
                    //nodes.innerHTML=this.#dynElements[startIndex].Element;
                    //element.appendChild(nodes)
                    console.log(this.#dynElements[startIndex].Element);
                    element.appendChild(this.#dynElements[startIndex].Element)
                }
                console.log(element);
            }
        }
        return true;
    }
    async #RenderTemplate()
    {
        let container = document.createDocumentFragment();
        var nodes = document.createElement('div');
        nodes.innerHTML= await this.#containerTemplate.GetStream();
        container.appendChild(nodes)
        return container;
    } 

}
