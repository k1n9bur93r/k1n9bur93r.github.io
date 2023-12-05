document.addEventListener("DOMContentLoaded", fetchBlog);

class blog
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

//imagine if certian pages can define themselves as being a DynPage and you can bind areas to hold onto a single or set of 'dynElements' so the page just kinda assembles itself on load? that can be cool to get rid of the manual hassle of setting up certian pages... maybe
class dynPage
{}

class dynElement
{
    constructor(data,template, )
    {
        let localData = data;
        let localTemplate = template;
        let localElement;
        this.Data= localData;
        this.Template=localTemplate;
        localElement=this.#RenderElement();
        this.Element= localElement;
    }
    #RenderElement()
        {
            let element = document.createDocumentFragment();
            var nodes = document.createElement('div');
            nodes.innerHTML=this.Template;
            element.appendChild(nodes)
            let props= element.querySelectorAll('#data');
            for(var prop of props)
            {
                //assumes there will always be a 1:1 binding so things can fail bad here 
                let name= prop.getAttribute('data');
                let value = this.Data[name];
                prop.textContent= value;
            }
            return element;
            
        } 
    SetTemplate(template)
    {
        localTemplate=template;
    }
    setData(data)
    {
        localData=data;
    }

}

function fetchBlog()
{

    fetch('templates/blog.html')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch Blog template');
            }
            return response.text();
        })
        .then(template=>{
            fetch('blogs.txt')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch Blogs');
                }
                return response.text();
            })
            .then(data => {
                let blogSources = data.split('---');
                let blogs = blogSources.map(blogSource=>new dynElement(new blog(blogSource),template));
                let blogContainer = document.getElementById('blogs');
                for( let blog of blogs.reverse())
                {
                    blogContainer.appendChild(blog.Element);
                }
            })
        })
        .catch(error=>{
            return [dynElement({error:`There was an error: ${error}`},errorTemplate)];
    });

}
