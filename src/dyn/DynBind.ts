export class DynBind {
    private PerformNCalculation(number: number, nMath: string): number {
      const nCalc = nMath.replace(/n/g, number.toString());
      return Number(eval(nCalc));
    }
  
    BindLoop(dynAtrValue: string, record: any[]): number[] {
      const splitArray = dynAtrValue.split('...');
      let startIndex = this.GetNValue(splitArray[0], record);
      let endIndex = this.GetNValue(splitArray[1], record);
      const indexes: number[] = [];
      let reverseOrder = false;
  
      if (startIndex > endIndex) {
        reverseOrder = true;
      }
  
      if (startIndex > record.length || endIndex > record.length) {
        throw new Error('Invalid index range specified for loop statement in dyn attribute. The starting or ending index ');
      }
      if (!reverseOrder) {
        for (let index = startIndex; index <= endIndex; index++) {
          indexes.push(index);
        }
      } else {
        for (let index = startIndex; index >= endIndex; index--) {
          indexes.push(index);
        }
      }
      return indexes;
    }
  
    BindIndex(dynAtrValue: string, dynRecord: any[]): number[] {
      let value = this.GetNValue(dynAtrValue, dynRecord);
  
      if (isNaN(value) || (value < 0 || value > dynRecord.length)) {
        throw new Error('Invalid index specified ');
      }
      return [value];
    }
  
    private GetNValue(value: string, dynRecord: any[]): number {
      if (value.length !== 1) {
        return this.PerformNCalculation(dynRecord.length - 1, value);
      } else if (value === 'n') {
        return dynRecord.length - 1;
      } else {
        return Number(value);
      }
    }
  }