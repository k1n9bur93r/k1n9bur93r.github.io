

let boardCommands=["NEWLINE","SKIPLINE","PAGEFILL"];

let formatCommands=['#p:',"#h:","#f:","#c:","#bg:","#t:"];
let formatPresetsName=['web1.0'];

let hrefTypes=['^l','^p'];
let loadSoundLengths=['SemiMedium',"Short"];
let formatpresetValues=[formatPresets("","RetroPixel","black","white","")];
let initLoad=true;

let soundCoolDown=false;

function formatPresets (href,font,color,background,text)
{
    return{href:href,font:font,color:color,bgColor:background,text:text}
}
function formatObject(stringRep)
{
    
    if(stringRep==undefined) return undefined;
    
    let templateObj={href:"h:",font:"f:",color:"c:",bgColor:"bg:",text:"t:"};
    let returnObj={href:"h:",font:"f:",color:"c:",bgColor:"bg:",text:"t:"};
    let hasFormat=false;
    let hasPreset=stringRep.includes('#p:');
    let splitString=stringRep.split("#").filter(Boolean);
    if(hasPreset)
    {
        let presetName= splitString.find( item=>{if(item.includes('p:')) return true;})
        if(presetName!=undefined)
        {
            presetName=presetName.replace('p:','');
            let indexOfPreset= formatPresetsName.indexOf(presetName);
           returnObj= formatpresetValues[indexOfPreset];
           hasFormat=true;
        }
    }
    for( const property in templateObj)
    {
      let foundItem; 
      splitString.forEach(item=>{
       if( item.includes(templateObj[property]))
            foundItem=item;
       }); 
       if(foundItem!=undefined){
        returnObj[property]=foundItem.replace(templateObj[property],"");
        hasFormat=true;
       }
    }
    if(hasFormat)
        return returnObj
    else
        return undefined;
}
let cellLetterFill="abcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()_+";

let TestText=[
    "#t:Hello#bg:red NEWLINE #t:with#bg:yellow#c:black NEWLINE #t:the#bg:green NEWLINE #t:pudding#bg:pink#bg:blue NEWLINE ",
    "Hello, My name is #t:Nicholas#p:web1.0#c:red#h:^phttps://www.google.com and I love making tools that speed up #c:maroon#t:BIZNIZZ. Like... NEWLINE 1. Internal #t:Tool#bg:green sets NEWLINE 2. Automated Deployments SKIPLINE 3. Eating #f:RetroPixel#t:Poptarts #bg:darkblue#t:SKIPLINE I also like doing other things, take a look!"
    ,"This is a new phrase that I would like to use inorder to test. #bg:red #bg:yellow #bg:green #bg:blue #t:PAGEFILL#bg:cyan There is really something to be said about stuff just ~working~  PAGEFILL SKIPLINE but in all reality... NEWLINE Does it even matter?"
    ,"Hello my name is jeff. NEWLINE I like the way that peas look when they are cooked PAGEFILL did you know that a bee is not able to fly... SKIPLINE they still do tho."
    ];

//Class Objects
let currentBillBoard=null;

// Event Trackers 
let globalQueuedAnimations=new Array();
let resizeTimer=null;

//Domain Elements
let dynamicAnimations=null;

// Base Element IDs
let CanvasID="Canvas";
let StyleID="Styles";

class BillBoard
{
    constructor(element=null)
    {
    this.element=element
    this.id="Board";
    this.ShadeID="Shade";
    this.GridBaseID="Grid";
    this.GridIDS=[];
    this.Grids= new Array();
    this.VisibleGrid=0;
    this.TotalText="";
    this.CreateBillBoard=function(CanvasParentID)
    {
        let billBoard= document.createElement('div');
        billBoard.id=this.id;
     
        billBoard.style.order=0;
        billBoard.style.flex='none'

        billBoard.style.display='flex';
        billBoard.style.justifyContent='center';
        billBoard.style.alignItems='center';
        
        billBoard.style.backgroundColor="#272727"
        //billBoard.style.width='clamp(450px,75vw,1950px)';
        billBoard.style.width='100%';
        billBoard.style.height='80%';
     
        document.querySelector(`div#${CanvasParentID}`).appendChild(billBoard);
        this.CreateShade(CanvasParentID);
        this.element=billBoard;
    }
    this.CreateShade= function (CanvasParentID)
    {
        let shade= document.createElement('div');

        shade.id=this.ShadeID;
     
        shade.style.order=0;
        shade.style.flex='none'
        shade.style.position='absolute';

        shade.style.display='none';
     
        shade.style.background="rgb(3,0,52)";
        shade.style.background="linear-gradient(180deg, rgba(2,0,33,1) 0%, rgba(30,30,33,1) 67%, rgba(33,33,33,1) 100%)"
     
        shade.style.opacity="0.0"
        shade.style.transition="opacity .15s"
     
       // shade.style.width='clamp(450px,75vw,1950px)';
        shade.style.width='auto%';
        shade.style.height='79%';
     
        document.querySelector(`div#${CanvasParentID}`).appendChild(shade);
    }
    this.LiftShade= function()
    {
        let shade = document.querySelector(`div#${this.ShadeID}`);
        shade.style.display="block";
        shade.style.opacity="100";
    }
    this.LowerShade= function ()
    {
        let shade = document.querySelector(`div#${this.ShadeID}`);
        shade.style.opacity="0";
    }
    this.PushNewGrid=function(grid)
    {
        this.Grids.push(grid);
        this.GridCount=this.Grids.length;
    }
    this.GridCount=0;
    
    this.CurrentGrid=0;
    this.NextGrid=function()
    {
        if(this.CurrentGrid<this.Grids.length-1)
        {
            
            this.Grids[this.CurrentGrid].SetVisible();
            this.Grids[++this.CurrentGrid].SetVisible();
            SoundHandler('page');

        }
    }
    this.PrevGrid=function()
    {
        if(this.CurrentGrid>0)
        {
            
            this.Grids[this.CurrentGrid].SetVisible();
            this.Grids[--this.CurrentGrid].SetVisible();
            SoundHandler('page');
        }
    }
    this.ClearGrids=function()
    {
        this.Grids.forEach(grid=>{
            grid.Clear();
        });
        this.Grids= new Array();
        this.GridIDS=[];
        this.GridCount=0;
        this.visibleGrid=0;
    }
     this.ClearAnimations= function()
    {
        this.ResetAnimation()
        dynamicAnimations=null;
        this.Grids.forEach(grid=>{
            for(let x=0;x<grid.Cells.length;x++)
            {
                clearTimeout(grid.Cells[x].animation); 
            }
        });
        globalQueuedAnimations=new Array();
    }
    this.ResetAnimation= function()
    {
    dynamicAnimations.remove();
    }
    
}
}

class Grid
{
    constructor(H,W)
    {
        this.GetHeight=function(H)
        {   
            return Math.floor((H-(H%(this.CellHeignt+this.CellGap)))/(this.CellHeignt+this.CellGap));
        }
        this.GetWidth=function(W)
        {
            return Math.floor((W-(W%(this.CellWidth+this.CellGap)))/(this.CellWidth+this.CellGap));
        }
        this.PushNewCell=function(cell)
        {
            this.Cells.push(cell);
        }
        this.element=null;
        this.id=null;
        this.CreateGrid=function(billBoard, gridNumber)
        {

            let grid=document.createElement('div');
            billBoard.GridIDS.push(`${billBoard.GridBaseID}${gridNumber}`)
            this.id=billBoard.GridIDS[billBoard.GridIDS.length-1];
            grid.id=this.id;
            
        
            let displayValue="";
            if(gridNumber==0)
            {            
                displayValue="grid"
                this.IsVisible=true;
            }
            else 
                displayValue="none";
        
            grid.style.display=displayValue;
            
            grid.style.gridTemplateColumns=`repeat(${this.WidthBoxes},${this.CellWidth}px)`;
            grid.style.gridTemplateRows=`repeat(${this.HeightBoxes},${this.CellHeignt}px)`;
            
            grid.style.placeItems='center';
            grid.style.gap='5px';
        
            grid.style.paddingLeft='5%';
            grid.style.paddingRight='5%';
            
            document.querySelector(`div#${billBoard.id}`).appendChild(grid);
            this.element=grid;
            return this.id;
        }
        this.ColumnPadding=1;
        this.CellWidth=25;
        this.CellHeignt=50;
        this.CellGap=5;
        this.timerDelay=3;
        this.CellArea=this.CellHeignt*this.CellWidth;
        this.HeightBoxes=this.GetHeight(H);
        this.WidthBoxes=this.GetWidth(W);
        this.TotalCells=this.GetHeight(H)*this.GetWidth(W);
        this.currentGridText= new Array();
        this.AnimTimerDelay=15;
        this.Words= new Array();
        this.Cells= new Array();
        this.Clear= function()
        {
            this.element.remove();

        }
        this.SetVisible= function()
        {
            if(this.IsVisible)
            {
                this.element.style.display="none";
                this.IsVisible=false;
            }
            else
            {
                this.element.style.display="grid";
                this.IsVisible=true;
            }
        }
        this.IsVisible=false;
        console.table(this)
    }

}

class Cell
{
    constructor(element=null)
    {
    this.defaultAnimation=`@keyframes ### {
        0% {
            transform: translateY(0%);
        }
    
        16% {
            transform: translateY(-44.09%);
        }
    
        28% {
            transform: translateY(-28.96%);
        }
    
        44% {
            transform: translateY(-34.87%);
        }
    
        59% {
            transform: translateY(-32.7%);
        }
    
        73% {
            transform: translateY(-33.52%);
        }
    
        88% {
            transform: translateY(-33.2%);
        }
    
        100% {
            transform: translateY(-33.3%);
        }
    
    }`;
    this.overRideAnimation=``;
    this.element=element;
    this.gridPosition=-1;
    this.textValue="";
    this.animation=null;
    this.animationRan=false;
    this.AnimTime=0;
    this.CreateCell= function(grid,timerDelay)
    {
      
        let cellBase = document.createElement('a');
    
        cellBase.style.position="relative";
        cellBase.style.height='100%';
        cellBase.style.width='100%';
        cellBase.style.display='inline-flex';
        cellBase.style.alignItems='center';
        cellBase.style.justifyContent='center';
        cellBase.style.fontSize='150%';
        cellBase.style.overflow="hidden";
        cellBase.style.color="white";
        cellBase.style.backgroundColor="#202020";
        cellBase.addEventListener('mouseover',UniversalHandler,false);
        cellBase.addEventListener('mouseout',UniversalHandler,false);
        cellBase.id='base';
        let cellScroll= document.createElement('div');
        
        cellScroll.style.position="absolute"
        cellScroll.style.top="0";
        cellScroll.style.width="100%";
        cellScroll.style.height="300%";
        cellScroll.style.display="flex";
        cellScroll.style.flexDirection="column";
        cellScroll.style.animation= `SetCellAnim-${timerDelay} 1s linear 1  forwards`;
        cellScroll.id='cell';

        let cellScrollTop= document.createElement('div');
        let cellScrollMid= document.createElement('div');
        let cellScrollBtm= document.createElement('div');
  
        cellScrollTop.style.width="100%";
        cellScrollTop.style.height="100%";
        cellScrollTop.style.fontFamily="BebasNeue"
        cellScrollTop.style.textAlign="Center";
        cellScrollTop.style.lineHeight=`${grid.CellHeignt}px`;
        cellScrollTop.style.backgroundColor='#292929';
        cellScrollTop.id='top';
  
        cellScrollMid.style.width="100%";
        cellScrollMid.style.height="100%";
        cellScrollMid.style.fontFamily="BebasNeue"
        cellScrollMid.style.fontSize=`${grid.CellHeignt-(grid.CellHeignt/3)}px`;
        cellScrollMid.style.textAlign="Center";
        cellScrollMid.style.lineHeight=`${grid.CellHeignt}px`;
        cellScrollMid.id='mid';
  
        cellScrollBtm.style.width="100%";
        cellScrollBtm.style.height="100%";
        cellScrollBtm.style.fontFamily="BebasNeue"
        cellScrollBtm.style.textAlign="Center";
        cellScrollBtm.style.backgroundColor='#121212';
        cellScrollBtm.style.lineHeight=`${grid.CellHeignt}px`;
        cellScrollBtm.id='btm';
    
        cellScroll.appendChild(cellScrollTop);
        cellScroll.appendChild(cellScrollMid);
        cellScroll.appendChild(cellScrollBtm);
    
        let cellGradTop= document.createElement('div');
        let cellGradBtm= document.createElement('div');
    
        cellGradTop.style.position="absolute"
        cellGradTop.style.top="0";
  
        cellGradBtm.style.position="absolute"
        cellGradBtm.style.top="0";
    
        cellGradTop.style.height='100%';
        cellGradTop.style.width='100%';
        cellGradTop.style.background="linear-gradient(0deg, rgba(0,0,0,0.4765291607396871) 0%, rgba(255,255,255,0) 31%)";
        cellGradBtm.id="cellSelectable"
        cellGradBtm.style.height='100%';
        cellGradBtm.style.width='100%';
        cellGradBtm.style.background="linear-gradient(0deg, rgba(0,0,0,0) 89%, rgba(255,255,255,0.4779516358463727) 100%)";
        
        cellBase.appendChild(cellScroll);
        cellBase.appendChild(cellGradTop);
        cellBase.appendChild(cellGradBtm);
        
        this.setAnimationDelay(timerDelay,'SetCellAnim-'+timerDelay);
        grid.element.appendChild(cellBase);
        this.gridPosition= grid.Cells.length;
        grid.PushNewCell(this.element);  
        this.element=cellBase

    }
    this.setAnimationDelay=function(time=null,animationName,animation=this.defaultAnimation)
    {
        this.animationRan=false;

        if(!time)
        {
            time=Math.floor(Math.random()*2);
        }
        let queuedAnim=setTimeout(this.appendCellAnimation,time,animation.replace('###',animationName) ,this);
        globalQueuedAnimations.push(queuedAnim)
        this.animation=queuedAnim;
    }
    this.SetText=function(char)
    {
        this.ScrollingLetter(char);
        this.textValue=char;
    }
    this.ApplyFormat=function(formatObject,char)
    {
        for(const item in formatObject)
        {
            if(!formatObject[item].includes('#'))
            {
                switch(item)
                {
                    case "href":
                        {
                            if(formatObject[item].includes('^l'))
                            {
                                formatObject[item]=formatObject[item].replace('^l','');
                                this.element.href=formatObject[item];
                            }
                            else if(formatObject[item].includes('^p'))
                            {
                                let local =formatObject[item].replace('^p','');
                                this.element.addEventListener('click',UniversalHandler,false);
                                this.element.pageRef=2;
                            }
                            break;
                        }
                    case "text":
                        {
                            this.SetText(char);
                            break;
                        }
                    case "font":
                        {
                            this.element.querySelector(':scope > div#cell').querySelector(':scope > div#mid').style.fontFamily=formatObject[item];
                            break;
                        }
                    case "color" :
                        {
                            this.element.querySelector(':scope > div#cell').querySelector(':scope > div#mid').style.color=formatObject[item];
                            break;
                        }
                    case "bgColor" :
                        {
                            this.element.querySelector(':scope > div#cell').querySelector(':scope > div#mid').style.backgroundColor=formatObject[item];
                            break;
                        }
                }
            }
        }

    }
    this.appendCellAnimation = function(animation,calledCell)
{
    if (!dynamicAnimations) {
        dynamicAnimations = document.createElement('style');
        dynamicAnimations.type = 'text/css';
        dynamicAnimations.id=StyleID;
        document.head.appendChild(dynamicAnimations);
      }
    calledCell.animationRan=true;
    dynamicAnimations.sheet.insertRule(animation, dynamicAnimations.length);
    }
    this.ScrollingLetter= function(chosenLetter)
    {
    let char1=chosenLetter!=" "?cellLetterFill[Math.floor((Math.random()*cellLetterFill.length))]: " ";
    let char2=chosenLetter!=" "?cellLetterFill[Math.floor((Math.random()*cellLetterFill.length))]: " ";
    this.element.querySelector(':scope > div#cell').querySelector(':scope > div#mid').textContent=chosenLetter;
    this.element.querySelector(':scope > div#cell').querySelector(':scope > div#top').textContent=char1;
    this.element.querySelector(':scope > div#cell').querySelector(':scope > div#btm').textContent=char2;
    }   
    }
}
//Event Hook Elements
document.getElementById('save').addEventListener('click',saveText,false);
window.addEventListener('load',SetTextOptions);
window.addEventListener('resize',PageResize)
document.getElementById("load").addEventListener('click',function(){
    if(initLoad){
        PageLoad(document.getElementById("text").value);
        initLoad=false;
    }
    else
    {
        NewGridText(document.getElementById("text").value);
    }
});
document.getElementById('down').addEventListener('click', function(){
    
currentBillBoard.NextGrid();

});
document.getElementById('up').addEventListener('click', function(){
currentBillBoard.PrevGrid();

});

//Events

function saveText()
{
    let text=document.getElementById('customText').value;
    TestText.push(text);
    SetTextOptions();
    if(currentBillBoard==null)
        PageLoad(TestText.length-1)
    else
        NewGridText(TestText.length-1);
    
}
function UniversalHandler(e)
{ 
    if (e.target.id=="cellSelectable")
    {
        if(e.type=="mouseover")
        {   
            SoundHandler('hover');
            e.target.style.background='rgba(255,255,255,.3)';
        }
        else if (e.type=="mouseout")
            e.target.style.background="linear-gradient(0deg, rgba(0,0,0,0) 89%, rgba(255,255,255,0.4779516358463727) 100%)";
        else if(e.type=="click")
            {
                SoundHandler('page');
                NewGridText(e.currentTarget.pageRef);
            }
    }

}

function SoundHandler(type)
{
    if(!soundCoolDown)
    {
        let audio;
        let path;
        switch(type)
        {
            case 'hover':
                {
                    path=`./contents/audio/hover/Hover_${Math.floor((Math.random()*25))+1}.mp3`
                    break;
                }
            case 'load' :
                {   
                    path=`./contents/audio/load/LoadFlip_SemiMedium.mp3`;
                    break;
                }
            case 'page' :
                {
                    path=`./contents/audio/newPage/NewPage.mp3`;
                    break;
                }
            case 'click' :
                {
                    path='./contents/audio/click/cellClick.mp3';
                    break;
                }
        } 
        audio = new Audio(path);
        audio.play();
        soundCoolDown=true;
        setTimeout(resetSoundTimeDelay,150);
    }
}

function resetSoundTimeDelay()
{
    soundCoolDown=false;
}

function PageResize()
{
    currentBillBoard.LiftShade();
    currentBillBoard.ClearGrids();
    if(resizeTimer)
    {
        return;
    }
    else
    {
        resizeTimer=setTimeout(PageResizeTimerActions,900);
    }

} 
function PageResizeTimerActions()
{
    currentBillBoard.ClearAnimations();
    currentBillBoard.LowerShade();
    CreateGrids(currentBillBoard);
    resizeTimer=null;
}
function NewGridText(index)
{
    currentBillBoard.ClearGrids();
    currentBillBoard.TotalText=TestText[index];
    currentBillBoard.ClearAnimations();
    CreateGrids(currentBillBoard);
    SoundHandler('load');
}

//Page Init Functions, in order of execution
function SetTextOptions()
{
    let dropdown=document.getElementById('text');
    let counter=dropdown.children.length;
    for(let x=counter;x<TestText.length;x++)
    {
        let option = document.createElement('option');
        option.id=`text${x}`;
        option.value=`${x}`;
        option.text=`Default ${x +1}`;
        dropdown.appendChild(option);
    }
    
}


function SetCanvas()
{
    let canvas= document.createElement('div');
    canvas.id=CanvasID;

    canvas.style.display='flex';
    //canvas.style.justifyContent='center';
    canvas.style.alignItems='center';

    canvas.style.width='100%';
    canvas.style.height='100%';

    document.querySelector('div#CanvasTarget').appendChild(canvas);
   
}
function PageLoad(value=0)
{
    SetCanvas();
    currentBillBoard=new BillBoard();
    currentBillBoard.CreateBillBoard(CanvasID);
    currentBillBoard.TotalText=TestText[value];
    SoundHandler('load');
    CreateGrids(currentBillBoard);

}


//Grid Propigation functions/helper functions 

function CreateGrids(billBoard)
{
    let words=billBoard.TotalText.split(/(\s+)/).filter(item=>{if(item!=' ')return true;});
    let gridCounter=0;
    let writtenWords=0;
    let canWrite=false;
    do
    {
        if(writtenWords>0)
        {
            let validStart=true;
            words=words.splice(writtenWords,words.length);
            while(validStart)
            {
                validStart=false;
            if(boardCommands.includes(words[0]))
            {
                words.shift();
                validStart=true;
            }
            }
        }
        let grid= new Grid(Number(billBoard.element.clientHeight),Number(billBoard.element.clientWidth));
        grid.CreateGrid(billBoard,gridCounter);
        billBoard.PushNewGrid(grid)
        gridCounter++;
        canWrite= CreateCells(grid,words);
        writtenWords=grid.Words.length
    }while(writtenWords<words.length && canWrite)
}

function CreateCells(grid,words)
{
    let currentWord=-1;
    let currentWordIndex=0;
    let cellFill=1;
    let currentRowPosition =0;
    let customFormat=undefined;
    let customFormatNonWord=false;
    let writeLetter=' ';
    for(let i=0;i<grid.TotalCells;i++)
    {
        
        let cell= new Cell();
        writeLetter=' ';
        cell.CreateCell(grid,grid.timerDelay*i);
        currentRowPosition =(grid.TotalCells-(i))%grid.WidthBoxes;

        if(currentWord<0 ||(currentWord<words.length && currentWordIndex==words[currentWord].length &&cellFill==0 ))
        {   
            currentWord++;
            currentWordIndex=0;

            let formatedWord=words[currentWord];
            cellFill=DetermineFillCount(grid,formatedWord,currentRowPosition,i); 
            console.log(formatedWord);
            customFormat=formatObject(formatedWord);
            formatedWord=DetermineTextFromFormat(formatedWord,customFormat);
            console.log(formatedWord);

            customFormatNonWord=(formatedWord==" " &&customFormat)||CheckCommand(formatedWord) ?true:false;

            if (formatedWord!=undefined)
                words[currentWord]=formatedWord;   

            if (customFormatNonWord)
                currentWordIndex=words[currentWord].length;
            
        }
        if(currentWord<words.length && cellFill==0)
        {
            writeLetter=words[currentWord][currentWordIndex];
            currentWordIndex++;
        }
        else
            cellFill--;  
        
        if(!customFormat||((customFormat && writeLetter==" " && !customFormatNonWord)))
            cell.SetText(writeLetter);
        else
            cell.ApplyFormat(customFormat,writeLetter);
    }
    
    let wordSection=[...words];
    grid.Words= [...wordSection.splice(words.Length,currentWord)];

    return currentWord==0?false:true;   
}
function CheckCommand(currentWord)
{
    if(currentWord==undefined) return false;
    let isCommand=false;
    boardCommands.forEach(command=>{
        if(currentWord.includes(command))
            isCommand=true;
    });
    return isCommand;
}
function DetermineFillCount(grid,currentWord,currentRowPosition,totalCellsFilled)
{
    let skipCells=1;
    if(currentWord==undefined)
          skipCells++;
    else if (currentWord.includes(boardCommands[0]))//newline
    {
        for(let x=0;x<currentRowPosition-1;x++)
        {
            skipCells++;
        }
    }
    else if (currentWord.includes(boardCommands[1]))//skipline
    {
        for(let x=0;x<currentRowPosition+grid.WidthBoxes-1;x++)
        {
            skipCells++;
        }
    }
    else if (currentWord.includes(boardCommands[2]))//pagefill
    {
        for(let x=0;x<grid.TotalCells-totalCellsFilled;x++)
        {
            skipCells++;
        }
    }
    else
    {
        if(currentWord.length>currentRowPosition-1)
            skipCells+=currentRowPosition;
    }
    return skipCells;
}
function DetermineFillChar(currentWord)
{
    let cellText=" "
    if(currentWord==undefined) return " ";
    boardCommands.forEach(command=>{
        if(currentWord.includes(command))
        {
           let fill= currentWord.replace(command,"");
           if(fill.length==0)
           {
            cellText=" "
           }
           else if(fill[0]!='#')
           {
            cellText= fill[0];
           }
        }
    });
    return cellText;
}
function DetermineTextFromFormat(currentWord, customFormat)
{
    let textCommand="t:"
    if(currentWord==undefined || !customFormat)
        return currentWord;
    currentWord=currentWord.split("#").filter(Boolean);
    let returnWord=" ";
    currentWord.find(split=>{
        if(split.includes(textCommand))
        {
            returnWord=split.replace(textCommand,"");
            return false;
        }
    });
    return returnWord;
}