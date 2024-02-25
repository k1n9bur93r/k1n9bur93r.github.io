const dynStreamTypes = {
    RECORD: 0,
    PLATE: 1,
    DYN: 3
};

 class dynStream
{

    constructor(source,typeId)
    {
        this.StreamType = this.#GetType(typeId);
        this.Source=source;
    }

    #Type = (Name,Id) => ({Name:Name,Id:Id});

    #GetType(typeId)
    {
        const foundType = this.#StreamType.find(type => type.Id == typeId);

        if(!foundType)
        {
            throw new Error("Invalid Dyn Stream. Unkown Type Id was supplied to Dyn stream.")
        }
        return foundType;
    }

    #StreamType = [this.#Type("Record",dynStreamTypes.RECORD),this.#Type("Plate",dynStreamTypes.PLATE),this.#Type("Dyn",dynStreamTypes.DYN)]

    #LocalStream = undefined;
    async Get(postFetchActn = (streamArg) => streamArg)
    {
        if(this.#LocalStream)
        {
            return this.#LocalStream;
        }

        console.log(`Getting stream type ${this.StreamType.Name} for ${this.Source}`);

        return await fetch(this.Source)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Invalid Stream Path. Failed to fetch ${this.StreamType.Name} from supplied path '${this.Source}'`);
            }
            let responseTextType = undefined;
            return response.text()})
        .then(stream => { 
            this.#LocalStream = postFetchActn(stream);
            return this.#LocalStream;
        });

    }

}

export {dynStream, dynStreamTypes}