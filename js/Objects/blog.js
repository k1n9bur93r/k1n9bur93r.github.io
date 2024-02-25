export class Blog
{
    constructor(sourceText)
    {
        this.Source = sourceText;
        this.Date = this.#createRegexForNthLineFeed(0);
        this.Title = this.#createRegexForNthLineFeed(1);
        this.Header =this.#createRegexForNthLineFeed(2);
        this.Text = this.#createRegexForNthLineFeed(3);

    }
    #createRegexForNthLineFeed(n) {
        if (n < 0) throw new Error("The number of line breaks (n) must be greater than or equal to 1.");
    
        const lineBreaks = '.*\n'.repeat(n);
        const regexPattern = new RegExp(`^${lineBreaks}(.*?)\\n`, 'm');
        return regexPattern.exec(this.Source)[1];
    }
    

    

}