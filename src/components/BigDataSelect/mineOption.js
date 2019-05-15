export default {
    name: 'MineOption',
    props: {
        data: Array,
        time0:Number,
        time1:Number,
        time2:Number,
        itemNum:Number,
        tableIndex:Number,
        groupIndex:Number,
        itemRowHeight:Number,
        labelName: String,
        valueName: String,
        keyName: String,
        currentSelectRow:{
            default:undefined
        }
    },
    data(){
        return{
        }
    },
    render(h){
        let vNodeList =[];
        let data = this.getShowDataList();
        if(data.length>=0){
            for(let i=0;i<data.length;i++){
                vNodeList.push(h("li",
                {
                    "class":{
                      "el-select-dropdown__item":true,
                      'selected': this.currentSelectRow==data[i],
                      'mineSelected': this.currentSelectRow==data[i],
                      'is-disabled': !!data[i].disabled,
                    },
                    on:{
                        "click":()=>{
                            if(!!data[i].disabled){
                                return
                            }else{
                                this.$emit("changeSelect",data[i])
                            }
                        },
                        // "mouseenter":()=>{
                        //     console.log (this.parentSelf);
                        //     console.log(i);
                        // }
                    },
                },
                data[i][this.labelName]));
            }
        }
        return h(
            "div",vNodeList
        );
    },
    methods: {
        getShowDataList(){
            let dataList = [];
            let count = 0;
            switch (this.tableIndex) {
                case 0:
                    count = this.time0 * this.itemNum * 3;
                    dataList = this.data.slice(count, count + this.itemNum);
                    break;
                case 1:
                    count = this.time1 * this.itemNum * 3;
                    dataList = this.data.slice(count + this.itemNum, count + this.itemNum * 2);
                    break;
                case 2:
                    count = this.time2 * this.itemNum * 3;
                    dataList = this.data.slice(count + this.itemNum * 2, count + this.itemNum * 3);
                    break;
            }
            return dataList;
        },
    },
    beforeDestroy() {
    },
}