import { DynPlate } from './DynPlate';
import { DynRecord } from './DynRecord';
import { DynRules } from './DynRules';
import {DynImport} from './DynImport';

export class DynPair {
  private Rules: DynRules = new DynRules();
  private Plate: DynPlate = new DynPlate();
  private Record: DynRecord;
  private Import: DynImport = new DynImport();

  constructor() {
    this.Record = new DynRecord(this.Rules);
  }

  async CreatePair(htmlNode: HTMLElement): Promise<void> {
    await this.Record.ParseRecord(htmlNode);
    await this.Plate.ParsePlate(htmlNode);
    await this.RenderPair(htmlNode);
  }

  private async RenderPair(htmlElement: HTMLElement): Promise<void> {
    const dynAttr = htmlElement.getAttribute('dyn');
    if (!dynAttr) {
      throw new Error('Dyn attribute is missing');
    }

    const getIndex = this.Rules.CheckDynValue(dynAttr);
    if (!getIndex) {
      throw new Error('Invalid dyn attribute value');
    }

    const recordIndexAttr = htmlElement.getAttribute('recordIndex');
    const indexToLoopOn = recordIndexAttr ? recordIndexAttr.split(',').map(Number) : [];
    const recordLevel = this.Record.GetRecordLoopingLength(this.Plate.PlateObj.RecordDepth || '', indexToLoopOn);
    const indexs = getIndex(dynAttr, recordLevel);
    const parser = new DOMParser();

    for (let i = 0; i < indexs.length; i++) {
      const recordIndices = recordIndexAttr ? recordIndexAttr.split(',').map(Number) : [];
      recordIndices.push(indexs[i]);

      this.Plate.BindRecordToProps(this.Record.Record, recordIndices);
      this.Plate.RenderPlate(indexs[i]);
      let plateCopy = parser.parseFromString(this.Plate.PlateObj.Render, 'text/html');
      let plateCopyElement : HTMLElement; // this needs to be thought out more? 
      plateCopyElement = plateCopy.children[0].children[1].children.length === 1 ? plateCopy.children[0].children[1].firstChild : plateCopy.children[0].children[1];
      
      if (plateCopyElement) {
        plateCopyElement.id = `${this.Plate.GenerateGUID()}#${indexs[i]}`;
        plateCopyElement.querySelectorAll('[recordIndex]').forEach((dyn) => {
          if (dyn instanceof HTMLElement && dyn.getAttribute('key') === this.Plate.PlateKey) {
            dyn.setAttribute('recordIndex', (dyn.getAttribute('recordIndex') || '').concat(recordIndices.join(',')));
          }
        });
        htmlElement.appendChild(plateCopyElement);

        const scriptContent = this.Plate.PlateObj.Render.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
        if(scriptContent)
        {
          console.log(scriptContent[1]);
          this.Import.LoadDynamicContentWithImports(scriptContent[1]).then(() => {
            if(window.DynRun)
            {
              window.DynRun(plateCopyElement.id);
            }
            else
            {
              console.warn(`A dyn ${plateCopyElement.id} has a <script> component but does not contain a 'DynRun' function to execute.`)
            }

          });
        }
      }
    }

    for (let index = 0; index < this.Plate.PlateSubDyn.length; index++) {
      htmlElement.querySelectorAll(`[plateindex="${index}"]`).forEach((dyn) => {
        if (dyn instanceof HTMLElement) {
          dyn.innerHTML = this.Plate.PlateSubDyn[index].innerHTML;
        }
      });
    }
  }

private  LoadDynamicContentWithImports(scriptContent: string) {
  // First, we need to get the absolute path for the import
  const baseURL = window.location.origin;
  const currentPath = window.location.pathname;
  
  // Assuming your src directory is at the root of your served content
  // Modify this path construction based on your actual server setup
  const jsPath = '/src/js/blogs/boenCanvas.js';
  const absoluteImportPath = `${baseURL}${jsPath}`;
  
  // Rewrite the relative import to use the absolute path
  const modifiedScript = scriptContent.replace(
    `../js/blogs/boenCanvas.js`,
    absoluteImportPath
  );
  
  // Create a Blob with the modified module code
  const blob = new Blob([modifiedScript], { type: 'text/javascript' });
  const url = URL.createObjectURL(blob);
  
  // Import and execute the module
  return import(url)
    .then(() => {
      URL.revokeObjectURL(url);
    })
    .catch(error => {
      console.error('Error loading module:', error);
      URL.revokeObjectURL(url);
    });
}

}