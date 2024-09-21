import { DynPlate } from './DynPlate';
import { DynRecord } from './DynRecord';
import { DynRules } from './DynRules';

export class DynPair {
  private Rules: DynRules = new DynRules();
  private Plate: DynPlate = new DynPlate();
  private Record: DynRecord;

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
}