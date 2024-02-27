export class dynActions
{
    BindLoop(dynAtrValue,dynRecord)
    {
        let splitArray = dynAtrValue.split('...')
        let startIndex= splitArray[0];
        let endIndex = splitArray[1];
        let recordToRender = new Array();
        let reverseOrder = false;

        if(isNaN(startIndex))
        {
            startIndex = this.#GetNValue(startIndex,dynRecord);
        }
        if(isNaN(endIndex))
        {
            startIndex = this.#GetNValue(startIndex,dynRecord);
        }
        if(startIndex > endIndex)
        {
            reverseOrder = true;
        }

        if(startIndex > dynRecord.length
            || endIndex > dynRecord.length)
            {
                throw new Error("Invalid index range specified for loop statement in dyn attribute. The starting or ending index ");
            }
        if(!reverseOrder)
        {
            for(let index = startIndex; index<endIndex;index++)
            {
                recordToRender.push(dynRecord[index])
            }
        }
        else
        {
            for(let index = startIndex; index>endIndex;index--)
            {
                recordToRender.push(dynRecord[index])
            }
        }

        return recordToRender;
    }

    #GetNValue(value, dynRecord)
    {
        if(value.length >1)
        {
            value = this.#PerformNCalculation(dynRecord.length-1,value);
        }
        else
        {
            value = dynRecord.length-1;
        }
        return value;
    }

    #PerformNCalculation(number, nMath) {
        var nCalc = nMath.replace(/n/g, number);    
        return eval(nCalc);;
    }

    BindIndex(dynAtrValue, dynRecord)
    {
        let recordToRender = new Array();

        if(dynAtrValue.toLowerCase() == 'n')
        {
            dynAtrValue = dynRecord.length-1;

        }

        if(isNaN(dynAtrValue) && dynAtrValue < 0 || dynAtrValue > dynRecord.length)
        {
            throw new Error("Invalid index specified ");
        }
        recordToRender.push(dynRecord[dynAtrValue]);
        return recordToRender;
    }

    BindPath()
    {
        //maybe we can return a new stream here that we then call the dyn walk through, and pass it in a tree and node? 
    }
}