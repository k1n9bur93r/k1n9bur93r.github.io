export class dynActions
{
    BindLoop(dynAtrValue,record)
    {
        let splitArray = dynAtrValue.split('...')
        let startIndex= splitArray[0];
        let endIndex = splitArray[1];
        let indexes = new Array();
        let reverseOrder = false;

            startIndex = this.#GetNValue(startIndex,record);
            endIndex = this.#GetNValue(endIndex,record);
        if(startIndex > endIndex)
        {
            reverseOrder = true;
        }

        if(startIndex > record.length
            || endIndex > record.length)
            {
                throw new Error("Invalid index range specified for loop statement in dyn attribute. The starting or ending index ");
            }
        if(!reverseOrder)
        {
            for(let index = startIndex; index<=endIndex; index++)
            {
                indexes.push(index)
            }
        }
        else
        {
            for(let index = startIndex; index>=endIndex; index--)
            {
                indexes.push(index)
            }
        }
        return  indexes
    }



    BindIndex(dynAtrValue, dynRecord)
    {
        if(isNaN(dynAtrValue))
        {
            dynAtrValue = this.#GetNValue(dynAtrValue,dynRecord);
        }

        if(isNaN(dynAtrValue) && dynAtrValue < 0 || dynAtrValue > dynRecord.length)
        {
            throw new Error("Invalid index specified ");
        }
        return [dynAtrValue]
    }

    BindPath()
    {
        //maybe we can return a new stream here that we then call the dyn walk through, and pass it in a tree and node? 
    }
    
    #GetNValue(value, dynRecord, isStart = true)
    {
        if(value.length != 1)
        {
            value = this.#PerformNCalculation(dynRecord.length-1,value);

        }
        else if (value == "n")
        {
            value = dynRecord.length-1; 
        }
        else
        {
            value = Number(value);
        }
        return value;
    }

    #PerformNCalculation(number, nMath) {
        var nCalc = nMath.replace(/n/g, number);    
        return Number(eval(nCalc));
    }
    GetIteration = (dynAtrValue, record) =>
    ({ action:dynAtrValue,iter:this.#GeIterationFromBindOrIndex(dynAtrValue)})
    #GeIterationFromBindOrIndex(dynAtrValue)
    {
        if(dynAtrValue.includes('...'))
        {
            let start = dynAtrValue.split('...')[0];
            let end = dynAtrValue.split('...')[1];
            if(start.length == 1)
            {
                if(isNaN(start))
                {
                    start = 0
                }
            }
            else
            {
                start = this.#PerformNCalculation(0,start);   
            }
            if(end.length == 1)
            {
                if(isNaN(end))
                {
                    end = 0
                }
            }
            else
            {
                end = this.#PerformNCalculation(0,end);   
            }
            return Math.abs(Math.abs(start)-Math.abs(end));
        }
        else
        {
            if(isNaN(dynAtrValue))
            {
                return 1
            }
            return dynAtrValue;
        }
    }
}