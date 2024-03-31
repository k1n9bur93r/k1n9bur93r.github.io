//Structure of a dyn Element 
/*

////////////
DYN <dyn> <dyn>
------------
A 'dyn'amic wrapper or element on an HTML page 
that can have JSON formatted objects bound to 
and iterated upon.  

Dyn elements rely on attributes to help define what html and what JSON is bound to the element. 
within this codebase we refer to this data as follows:
 A 'Plate' is html formatted text. 
    - It can be the 'innertHTML' of the dyn element 
    - It can be fetched text over the js fetch api. 
    if you have an html file on your server you can fetch it 
    and re use it, for instance. 
A 'Record' is JSON formatted text
    - Values from a JSON object can bind to mustach '{{' notaiton 
    - Non JSON formated white text can be parsed by user defined functions into JSON, using the 'shape' attribute 
    - Items are assumed to be, or converted into, arrays
    - When a new 'record' is called through the attribute, it creates a new 'record Scope' for all child dyns
    This is a technique that allows the rendering of multiple UI elements from the same piece of shared data 
    - Records can further be 'morphed' into different forms before access using the 'morphed' attribute 
A 'Stream' is the foundational fetch API wrapper for the codebase
    - it handeles all requests that come in for records or plates
    - It cahces resuts for all further requests on the page
    - Acts as a centeralized memory store for all nodes in a tree 
-------
Additional note!
-------
Any items that are fetched from api are handeled by and stored 
with an item called the 'dynStream' a single hash map that acts 
as a shared resource for all references of stored data. 
    - Useage is not very elegent needeing to use syntax like 
        dynStream(resourcePath,dynStreamType.Record).Get();
    Though that is more of a 'dev' problem than a 'user' one, seems worth the hit. 
////////////////////////
Example Usage
////////////////////////
<h1>Newest Blog</h1>
<dyn="n" record="./blogs.txt" shaper="ParseForBlogs">
    <h1>{{Title}} </h1>
    <h2>{{Header}} </h2>
    <br> 
    <p>{{Text}} </p>
    <p><sub>{{Date}}</sub></p>
</dyn>
///
Or
///
<h1>Most Popular Recent Blogs: </h1>
<dyn="n...n-5" morph="OrderByStatsMonthlyDesc" recored="./blogs.txt" plate="./snippits/RecentBlogHeader.html"></dyn>
///
think about these
///
dyn="0",dyn="2",dyn="0...2",dyn="n",
dyn="0...n",dyn="n...13",dyn="n-10...5"

The primary function of the value stored in the dyn 
is to determine how it can be iterated over
- a value in the index is like accessing an array using braces dyn="10" => record[10]
- As a stand in the 'end' of the array we can use the value 'n' assuming we do not know
the lenght of the array. so A record (json list) with 25 items would have an 'n' of 25
so <dyn="n"> is record[24]
- Simple arithmetic is also possible! using the following dyn value of n-5 with a 
record of 25 would return 19, for record[19]
-Iteration! Using the '...' ellipsis between two integer values in a dyn will 
perfrom a 0 starting index search of elements from an array so:
<dyn="16...n-5" on a record with a '.lenth' value of 25 will produce a valid array search of 
record[16],[17],[18],[19], and 'bind' the record(json) value to the plate from the dyn
-Being able to alter the sizing/ordering of a record, then futher modifying the selected 
area with a dyn index range value can be quite powerful 

////////////
Attributes plate, record, shape, morph,
------------
These custom attributes, added to the html dyn Element can allow for the gathering and modifying of data, and rendering

Resource Gathering 
- 'Record' : Same records as before, this is how you bind the value behind this URL to the dyn for rendering. It also in 
charge of createing a new record scope.
- short name of r, for r=""

<dyn record='www.weather.com/api/city/NA_LasVegas">
<h1> Current Weather : {{currentWeather}}</h1>
<br>
<h3>Previous Weather </h3>
<dyn="last10dayAverage@n-1...n-7" class="prevWeatherRow">
<p>{{}}}</p>
</dyn>

</dyn>

_'Plate'
blah blah blah
- short name of p for p=""



-'Shaper'

-short name of s for s=""

-'Morph'

-short name of m for m=""

*/


/*
Multi level dyns and recuriosn 
<dyn="0...10" r="./list.json">
    <p>{{ItemName}}</p>
    <p>{{ItemCat}}</p>
    <p>{{ItemEsp}}</p>
    <dyn="0" r="./x/listData.json">
        <h2>{{ListDataObj}}</h2
    </dyn>
</dyn>


How do we handel this? How is this meant to work...what are the rules that we need to set here? 

- Rule 1: If a plate has an external plate, ie " p ,or plate='' " then 
anything on the inside is ignored and over ridden. Console is warned, but anything on the inside will get munched
-Rule 2: Ordering of the internal plate is to be maintained. For instanace above there are 3 p elementes
then a dyn of a single element. All of which is to repeated 10 times. That means 10 copies of the 3 ps and a copy 
of the dyn behind it. 
--Rule 2 cont: if the inner dyn was set to be dyn="0...5" then we would expect 5 elements repeated inside the dyn, so 
three ps on top, then 10 h2's in the dyn 


 */

/* 

The page loads up once 

-   A search is done all across the page looking for <dyn> elements
(maybe we can do some kind of parent child search here eh)
-   All 'r-ecords' and all 'p-lates' values will be gathered and queued to fetch from the 
dynStream 
-   All dyns with a record has a 'rendering' attribute applied to it and starts building the dynNodeTree
each parent tree node is saved to an array called 'recordScopes'.
    -- The RecordScopes array is an array that stores all of these tree nodes with defined dyns 'roots'
    Assumptions are made based on what dyns do and do not have data. These 'roots' of their 'scopes' help out.
        --- The data stored here is {node: dynNode, isParent:false hasFinished:false}
            node: just stores a reference to this particular dyn node to access easy
            isParent: starts as false, eventually in a dfs it's possible that some of these nodes are encountered
            in the parse. This means that the node would have a parent, and would be a leaf and not a root node.
            hasFinished: Is used for state management false at start, true once ran
            Hasparent is a bool which starts at false, so if we check a different value's Hasparent as false, we 
            don't know if it is truly false or just not encountered yet.

*/

/*
Dyn building does the following.
- Looks at itself, Do I have a record attr? Yes: No => Record value 
    Yes: Fetch/Get the value from the dynStream
    No: Do nothing (impossible to hit this now, things will break if it was hit lol )
- Look at itself, Look at Dyn Value
    1. Perform some regex parsing across the dyn, important parses would be :
        - Single index or loop ? Yes : No => bool flags 
            We render at single indexs, nothing more to render, just referrence
            If there is a loop then there can be content which could render additional content, we need to make new dyns to render sub objects
            If Index then 
            - Renderable is set to true
            - Convert single dynValue into recordIndex 
                ie n, n-5m "5" and set to Node Index Object
            If Loop then 
            - set Renderable to false
            -convert x and y of 'x...y' to numbers , keeping our notation of (n,n-#,x,x-#,#) to get {#1...#2}, 


            
- Looks at itself, Do I have a plate attr ? Yes : No => Plate value
    Yes: get value from plate attr, load into dynStream to call for new or existing fetched data, exit if then run 'NO' 
    No: A value innerPlate is set for you, 
        1. Search through the text for any 'dyn' elements 
        2. Go through that list apply a 'rendering' attribute to each element 
        3. await call the same dfs that the top of this list. 
        4. Perform a dfs down the innerPlate object. Skipping any 'dyn' elements  //{{entry point for @symbols or x. exlsuions or something maybe hrrrmmmm}}
        5. on each of these objects check if the inner text contains a pairing for '{{}}' mustash quotes ? Yes : NO
            No: Ignore and look at children then retrun
            Yes: Create / Update an array object containing a map defined as 
                props[text].push({ [text]: text,plate:childNode,plateText:childNode.innerText });  
                where the 'text' if the extrated value from the mushtash, plateText is the full mustash quote with the text inside of it, and plate is a reference to an html element.
            MUSH
            MUSH
            MUSH

*/