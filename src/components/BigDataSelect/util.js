/**
 * 通过
 * parm
 * index:当前获取的表格的位置0,1,2
 * times:第几轮
 * itemNum：每一个组显示几个option
 * data:切割的data
 * 
 */
export function getTable(tableIndex,times,itemNum,data){
    let dataList = [];
    let count = times * itemNum * 3;
    switch (tableIndex) {
        case 0:
          dataList = data.slice(count, count + itemNum);
          break;
        case 1:
          dataList = data.slice(count + itemNum, count + itemNum * 2);
          break;
        case 2:
          dataList = data.slice(count + itemNum * 2, count + itemNum * 3);
          break;
    }
    return dataList;
};