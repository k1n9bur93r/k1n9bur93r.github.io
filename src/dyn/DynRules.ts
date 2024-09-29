import { DynBind } from './DynBind';

export class DynRules {
  private Bind: DynBind = new DynBind();
  private ServerPath: RegExp = /^(.+)\/([^\/]+)$/;
  private Loop: RegExp = /^(?:\d+|n(?:-\d+)?)\.{3}(?:\d+|n(?:-\d+)?)$/;
  private Index: RegExp = /^(?:\d+|n(?:-\d+)?)$/;
  private WhiteSpace: RegExp = /^\s*$/;

  private isWhitespace(str: string = ' '): boolean {
    return this.WhiteSpace.test(str);
  }

  CheckDynValue(dynAttributeValue: string): ((value: any, record: any[]) => number[]) | undefined {
    switch (true) {
      case dynAttributeValue === '':
        return (value: any, record: any[]) => [0];
      case this.ServerPath.test(dynAttributeValue):
        return undefined;
      case this.Loop.test(dynAttributeValue):
        return this.Bind.BindLoop.bind(this.Bind);
      case this.Index.test(dynAttributeValue):
        return this.Bind.BindIndex.bind(this.Bind);
      default:
        throw Error(`Invalid value in element's Dyn attribute. Cannot be matched to a valid pattern '${dynAttributeValue}'.`);
    }
  }

  CheckServerPath(recordAttributeValue: string): boolean {
    return this.ServerPath.test(recordAttributeValue);
  }

  CheckDynServerAttributes(htmlElement: HTMLElement): void {
    // Implementation needed
  }

  CheckFuncExists(htmlElement: HTMLElement, attributeToCheck: string): boolean {
    if (!htmlElement.hasAttribute(attributeToCheck)) {
      return false;
    }
    const funcName = htmlElement.getAttribute(attributeToCheck);
    if (funcName && !window[funcName as keyof typeof window]) {
      console.warn(`%cWARNING: Referenced function does not exist for Dyn attribute action,${funcName} will be evaluated as a bool conditional.`, 'font-weight: bold; color: Orange;');
      return false;
    }
    return true;
  }

  CheckDynHasPlate(htmlElement: HTMLElement, localPlate: string): void {
    if (htmlElement.hasAttribute('plate') && !this.isWhitespace(localPlate)) {
      throw Error(`Plate binding conflict. Dyns with an external Plate must not have an internal Plate. Element must have an empty inner HTML '${localPlate}' `);
    }

    if (!htmlElement.hasAttribute('plate') && this.isWhitespace(localPlate)) {
      throw Error('Empty Plate binding. Dyn has no external Plate or internal Plate. Dyn needs a Plate attribute or an inner HTML to bind too.');
    }
  }
}