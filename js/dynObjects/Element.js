export class dynElement
{
    constructor(data,template, )
    {
        let localData = data;
        let localTemplate = template;
        this.Data= localData;
        this.Template=localTemplate;
        this.Element= this.#RenderElement();
    }
    #RenderElement()
        {
            let element = document.createDocumentFragment();
            var nodes = document.createElement('div');
            nodes.innerHTML=this.Template;
            element.appendChild(nodes)
            let props= element.querySelectorAll('[data]');
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
