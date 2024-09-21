

// File: DynPlate.ts
import { PlateObj, PlateObjItem } from './types';
import { DynAlias } from './DynAlias';
import { DynStream } from './DynStream';
import { DynStreamTypes } from './types';

export class DynPlate {
  PlateObj: PlateObj = {
    Props: {}, RecordDepth: undefined, Template: '', Render: '',
  };

  PlateSubDyn: HTMLElement[] = [];

  public PlateKey: string | undefined = undefined;

  private CreatePlateObjItem = (propValue: any, recordIndex: string): PlateObjItem => ({
    value: propValue, isArray: false, arrayValues: [], recordIndexPath: recordIndex,
  });

  RenderPlate(arrayPropIndex: number): void {
    let plateToRender = this.PlateObj.Template;
    Object.entries(this.PlateObj.Props).forEach(([propName, propValue]) => {
      if (typeof propValue.value === 'object') {
        console.warn("Can't bind an object to a plate");
      }
      plateToRender = plateToRender.replace(
        new RegExp(`{{${propName}}}`, 'g'),
        propValue.isArray ? propValue.arrayValues[arrayPropIndex] : propValue.value,
      );
    });
    this.PlateObj.Render = plateToRender;
  }

  BindRecordToProps(record: any, recordIndices: number[]): boolean {
    let boundProps = false;
    for (const propertyString in this.PlateObj.Props) {
      boundProps = true;
      const properties = propertyString.split('.');
      let y = 0;
      let result: any = record;
      for (let i = 0; i < properties.length;) {
        const property = properties[i];
        if (Array.isArray(result)) {
          result = result[recordIndices[y]];
          y++;
        } else {
          result = result[property];
          i++;
        }
        if (result === undefined || result === null) {
          break; // throw and error here
        }
      }
      if (Array.isArray(result)) {
        this.PlateObj.Props[propertyString].arrayValues = result;
        this.PlateObj.Props[propertyString].isArray = true;
      }
      this.PlateObj.Props[propertyString].value = result;
    }
    return boundProps;
  }

  async ParsePlate(htmlElement: HTMLElement): Promise<void> {
    let plateAttributeValue = htmlElement.getAttribute('plate');
    if (plateAttributeValue) {
      plateAttributeValue = DynAlias.FetchOrSetAliasIfApplicable(plateAttributeValue);
      if (plateAttributeValue[0] === '#') {
        const template = document.querySelector(plateAttributeValue);
        if (template) {
          template.style.display = 'none';
          htmlElement.innerHTML = template.innerHTML;
        }
      } else {
        htmlElement.innerHTML = await new DynStream(plateAttributeValue, DynStreamTypes.PLATE).Get();
      }
    }
    this.PlateKey = this.GenerateGUID();
    await this.ParsePlateForProps(htmlElement);
    this.PlateObj.Template = htmlElement.innerHTML;
    htmlElement.innerHTML = '';
  }

  private async ParsePlateForProps(parentElement: HTMLElement | string): Promise<boolean> {
    let hasDyn = false;
    if (typeof parentElement === 'string') {
      const container = document.createElement('div');
      container.innerHTML = parentElement;
      parentElement = container;
    }

    for (let i = 0; i < parentElement.childNodes.length; i++) {
      const childHtmlNode = parentElement.childNodes[i] as HTMLElement;
      if (childHtmlNode.nodeType === 1) {
        if (childHtmlNode.hasAttribute('dyn')) {
          hasDyn = true;
          childHtmlNode.innerText.match(/{{.*\..*}}/) ? childHtmlNode.setAttribute('recordIndex', '') : undefined;
          childHtmlNode.setAttribute('plateindex', `${this.PlateSubDyn.length}`);
          childHtmlNode.setAttribute('key', this.PlateKey || '');
          this.PlateSubDyn.push(childHtmlNode.cloneNode(true) as HTMLElement);
          childHtmlNode.innerHTML = '';
        } else if (!await this.ParsePlateForProps(childHtmlNode) && childHtmlNode.innerText && childHtmlNode.innerText.match(/^{{([^\}]+)}}$/)) {
          const text = childHtmlNode.innerText.match(/\{\{(.*?)\}\}/)?.[1].trim() || '';
          const hasExistingProp = this.PlateObj.Props[text] !== undefined;
          this.PlateObj.Props[text] = hasExistingProp ? this.PlateObj.Props[text] : this.CreatePlateObjItem(text, childHtmlNode.getAttribute('recordIndex') || '');
          const hasRecordDepth = this.PlateObj.RecordDepth !== undefined;
          this.PlateObj.RecordDepth = hasRecordDepth ? this.PlateObj.RecordDepth : text;
        }
      }
    }
    return hasDyn;
  }

  GenerateGUID(): string {
    return 'xxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}