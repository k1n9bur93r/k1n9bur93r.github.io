export class dynObject
{
    constructor(source,isData)
    {
        this.isData=isData;
        this.Source=source;
        this.Stream= this.Get();
       
    }
    #localStream = undefined;
    async Get()
    {
        const fetchedStream= await fetch(this.Source)
        if (!fetchedStream.ok) {
            throw new Error(`Failed to fetch ${this.isData == true ?"Data":"Template"}} from ${this.Source}`);
        }
        this.#localStream = await fetchedStream.text();
        return this.#localStream;
    }
    async GetStream()
    {
        if(this.#localStream == undefined)
        {
            return await this.Get();
        }
        return this.#localStream;
    }
}