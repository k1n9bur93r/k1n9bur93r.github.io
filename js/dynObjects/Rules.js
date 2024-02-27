import { dynActions } from "./Actions.js";

export class dynRules 
{

    #Actions = new dynActions();
    #ServerPath = /^(\/[A-Za-z0-9_-]+)+\/[A-Za-z0-9_.-]+\.[A-Za-z]+$/;
    #Loop = /^(?:\d+|n(?:-\d+)?)\.{3}(?:\d+|n(?:-\d+)?)$/;
    #Index = /^(?:\d+|n)$/;
    #WhiteSpace = /^\s*$/;

    #isWhitespace(str = " ") {
        return this.#WhiteSpace.test(str);
    }

    CheckDynValue(htmlElement)
    {
        const dynAttributeValue = htmlElement.getAttribute('dyn');
        //These can either return some kind of true, but would be cooler if they could return an action to take? 
        switch(true)
        {
            case dynAttributeValue == "":
                {
                    return undefined;
                    //break;
                }
            case this.#ServerPath.test(dynAttributeValue):
                {
                    //need to figure out how to do this part, I will probs need at least one extra thing then gotta spin out 
                    return undefined
                    //break;
                }
            case this.#Loop.test(dynAttributeValue):
                {
                    return this.#Actions.BindLoop.bind(this.#Actions);
                    //break;
                }
            case this.#Index.test(dynAttributeValue):
                {
                    return this.#Actions.BindIndex.bind(this.#Actions)
                    //break;
                }
            default:
                {
                    throw Error (`Invalid value in element's Dyn attribute. Cannot be matched to a valid pattern '${dynAttributeValue}'.`);
                }
        }
    }

    CheckDynServerAttributes(htmlElement)
    {
       // we will need to do something a bit different here in terms of import and validation 
       //I dont think we want any records, internal or external plates for these divs 
    }

    CheckFuncExists(htmlElement,attributeToCheck)
    {
        if( !htmlElement.hasAttribute(attributeToCheck))
        {
            return false;
        }
        const funcName = htmlElement.getAttribute(attributeToCheck);
        if(!window[funcName])
        {
            // implement this 
            console.warn(`%cWARNING: Referenced function does not exist for Dyn attribute action,${funcName} will be evaluated as a bool conditional.`, 'font-weight: bold; color: Orange;')
            return false;
        }
        return true;
    }

    CheckDynHasPlate(htmlElement,localPlate)
    {
        if (htmlElement.hasAttribute('plate') && !this.#isWhitespace(localPlate))
        {
            throw Error (`Plate binding conflict. Dyns with an external Plate must not have an internal Plate. Element must have an empty inner HTML '${localPlate}' `)
        }

        if(!htmlElement.hasAttribute('plate') && this.#isWhitespace(localPlate))
        {
            throw Error ('Empty Plate binding. Dyn has no external Plate or internal Plate. Dyn needs a Plate attribute or an inner HTML to bind too.')
        }

    }


    //this might be misplaced, ignoring as part of the main attribute check loop 
    CheckPlateHasProp(htmlElement)
    {
        const parser = new DOMParser();
        const plate = parser.parseFromString(htmlElement, "text/html");
        const matchingPropElements = plate.querySelectorAll('[Prop]');
        if(matchingPropElements.length == 0)
        {
            throw Error ('Propless Plate. Plate has no elements that contain a Prop attribute. No Record properties can be bound to the Plate.')
        }
    }
}