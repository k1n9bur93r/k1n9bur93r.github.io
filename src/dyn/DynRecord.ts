import { DynRules } from './DynRules';
import { DynAlias } from './DynAlias';
import { DynStream } from './DynStream';
import { DynStreamTypes } from './types';

export class DynRecord {
  Record: any = undefined;
  private Rules: DynRules;

  constructor(rules: DynRules) {
    this.Rules = rules;
  }

  async ParseRecord(htmlElement: HTMLElement): Promise<void> {
    let postLoadAtn = (record: string): any[] => {
      let parsedRecord = JSON.parse(record);
      if (!Array.isArray(parsedRecord)) {
        parsedRecord = [parsedRecord];
      }
      return parsedRecord;
    };

    let postAtnFilter = (record: any): any => record;
    let preFilteredRecord: any;

    if (this.Rules.CheckFuncExists(htmlElement, 'shape')) {
      const shapeAttr = htmlElement.getAttribute('shape');
      if (shapeAttr) {
        postLoadAtn = (window as any)[shapeAttr];
      }
    }

    if (this.Rules.CheckFuncExists(htmlElement, 'filter')) {
      const filterAttr = htmlElement.getAttribute('filter');
      if (filterAttr) {
        postAtnFilter = (window as any)[filterAttr];
      }
    }

    const recordAttr = htmlElement.getAttribute('record');
    if (!recordAttr) {
      throw new Error('Record attribute is missing');
    }

    let recordAttributeValue = DynAlias.FetchOrSetAliasIfApplicable(recordAttr);

    if (this.Rules.CheckServerPath(recordAttributeValue)) {
      preFilteredRecord = await new DynStream(recordAttributeValue, DynStreamTypes.RECORD).Get(postLoadAtn);
    } else {
      preFilteredRecord = (window as any)[`${recordAttributeValue}`];
      if (!preFilteredRecord) {
        throw new Error('A valid server location or window bound JS object was not set for the Plate');
      }
    }

    this.Record = postAtnFilter(preFilteredRecord);
  }

  GetRecordLoopingLength(recordPath: string, recordIndices: number[]): any {
    if (recordIndices.length === 0) {
      return this.Record;
    }

    const properties = recordPath.split('.');
    let result: any = this.Record;

    properties.forEach((property) => {
      if (Array.isArray(result)) {
        if (recordIndices.length === 0) {
          throw new Error(`No indices provided for array access in '${recordPath}'`);
        }
        const index = recordIndices.shift();
        if (index !== undefined) {
          result = result[index];
        }
      } else {
        result = result[property];
      }
      if (result === undefined || result === null) {
        throw new Error(`Record structure does not match with provided path '${recordPath}', indices '${recordIndices}'`);
      }
    });

    return result;
  }
}