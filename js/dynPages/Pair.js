import { dynStream, dynStreamTypes} from "./Stream.js";
import { dynRules } from "./Rules.js";


export class dynPair
{
    #Rules = new dynRules();
    #Record = undefined;
    #Plate = undefined;
    Obj = undefined;
    #InheritedPlate = false;
    async LoadPair(htmlElement)
    {
        await this.#ParseRecord(htmlElement);
        await this.#ParsePlate(htmlElement);
        //this might be a better place to build our dyn rules 
    }

    static VerifyDynPairType(objectToCheck)
    {
        if(!objectToCheck instanceof dynPair)
        {
            throw Error('Object is not of type dynPair');
        }
    }
    async #ParseRecord(htmlElement)
    {
        if(htmlElement.hasAttribute('record'))
        {
            this.#Record = undefined;
            let postLoadAtn = undefined
            if(this.#Rules.CheckFuncExists(htmlElement,'shape'))
            {
                postLoadAtn = window[htmlElement.getAttribute('shape')];
            }
            let record = await new dynStream(htmlElement.getAttribute('record'),dynStreamTypes.RECORD).Get()
            if(postLoadAtn)
            {
                this.#Record = postLoadAtn(record);
            }
            else
            {
                this.#Record = [JSON.parse(record)];
            }
        }
    }

    async #ParsePlate(htmlElement)
    {

        let localElement = document.createElement('div');
        let totalChildElements = htmlElement.children.length;
        let elementsWithDyn =0;
        let localPlate = "";
        Array.from(htmlElement.children).forEach(child =>{
            if(!child.hasAttribute('dyn'))
            {
                localElement.appendChild(child);
            }
            else
            {
                elementsWithDyn++;
            }
        });
        localPlate = elementsWithDyn != totalChildElements ? localElement.innerHTML : "";
        this.#Rules.CheckDynHasPlate(htmlElement,localPlate);
        if(!htmlElement.hasAttribute('plate'))
        {
            this.#Plate = localPlate;
            this.Obj= this.#GetObj(localPlate);
        } 
        else if(htmlElement.hasAttribute('plate'))
        {
            this.#Plate = undefined;
            //we can validate here for plate existance rules
            let externalPlate = await new dynStream(htmlElement.getAttribute('plate'),dynStreamTypes.PLATE).Get()
            this.#Plate = externalPlate;
            this.Obj= this.#GetObj(localPlate);
        }

    }

#GetObj(htmlElement)
{
    const propObj = {props:[],RenderPlate: ()=>{
        let plateCopy = this.#Plate;
        for (const [key, value] of Object.entries(this.Obj.props)) {
            plateCopy = plateCopy.replace(new RegExp(`{{${key}}}`, 'g'), value);
        }
        return plateCopy;
      },
    };
    let getProps = (plate)  => {
        if (plate.innerText && plate.innerText.includes("{{") && plate.innerText.includes("}}")) {
        const text = plate.innerText.match(/\{\{(.*?)\}\}/)[1].trim();
        propObj.props[text] = { [text]:text,plate:plate};
        }
        Array.from(plate.children).forEach(child =>{
            getProps(child);
        });
    }
    var jsElement = document.createElement('div');
    jsElement.innerHTML = htmlElement;
    getProps(jsElement);
    if(propObj.props == [])
    {
        throw new Error("Propless Plate. Plate has no elements that have {{props}} to bind to. No Record properties can be bound to the Plate.");
    }
    return propObj;
}

    SetRecord = (newRecord, inherited = true ) => 
    {
        this.#Record = newRecord
        this.#InheritedPlate = inherited;
    }

    IsPlateInherited = () => this.#InheritedPlate;

    SetPlate= (newPlate) => this.#Plate = newPlate

    GetRecord = () => this.#Record;

    GetPlate = () => this.#Plate

}
