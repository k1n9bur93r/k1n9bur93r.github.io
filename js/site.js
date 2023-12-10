
import { dynContainer } from '../js/dynObjects/Container.js';
import { Blog } from '../js/Objects/blog.js';

document.addEventListener("DOMContentLoaded", LoadSite);
let localTemplates = new Array();
let localElements = new Array();

async function LoadSite()
{
    let templates = document.querySelectorAll('[template]');
    let elements = document.querySelectorAll('[data]');

    for(let template of templates)
    {
        localTemplates.push(new dynContainer(template.getAttribute('data'),Blog,template.getAttribute('element'),template.getAttribute('template')));
    }
    localTemplates[0].FetchDyns()
    .then(result =>
        {
            if (result == true)
            {
                document.getElementById('zig').appendChild(localTemplates[0].Container);
            }
        })
}

function fetchBlog()
{

    fetch('templates/BlogEntry.html')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch Blog template');
            }
            return response.text();
        })
        .then(template=>{
            fetch('../blogs.txt')
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
