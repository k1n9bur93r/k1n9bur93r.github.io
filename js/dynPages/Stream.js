const dynStreamTypes = {
    RECORD: 0,
    PLATE: 1,
    DYN: 3
};

 class dynStream
{
    static CachedStreams = new Map();
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

    #LocalStream = () =>  dynStream.CachedStreams.get(this.Source); //undefined;

    #GetCachedStream(streamSource)
    {
        if(dynStream.CachedStreams.has(streamSource))
        {
            return dynStream.CachedStreams.get(streamSource);
        }
        else
        {
            dynStream.CachedStreams.set(streamSource,'undefined');
        }
    }

    async #WaitTillFetched(key) {
        while (true) {
          const value = dynStream.CachedStreams.get(key);
          if (value !== 'fetching') {
            return value;
          }
          await new Promise(resolve => setTimeout(resolve, 5)); // Wait for 1 second before rechecking
        }
      }

    async Get(postFetchActn = (streamArg) => streamArg)
    {
        if(this.#LocalStream())
        {
            await this.#WaitTillFetched(this.Source)
            return this.#LocalStream(); 
        }
        dynStream.CachedStreams.set(this.Source,'fetching');

        console.log(`Getting stream type ${this.StreamType.Name} for ${this.Source}`);

        return await fetch(this.Source)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Invalid Stream Path. Failed to fetch ${this.StreamType.Name} from supplied path '${this.Source}'`);
            }

            return response.text()})
        .then(stream => { 
           let modifiedStream= postFetchActn(stream);
            dynStream.CachedStreams.set(this.Source,modifiedStream);
            return this.#LocalStream();
        });

    }

}

export {dynStream, dynStreamTypes}