<template>
  <div>
    <el-input
			ref="reference"
			style="width:200px"
			v-model="inputlabel"
			clearable debounce
			:placeholder="placeholder"
			@keydown.esc.stop.prevent="visible = false"
			@focus="handleFocus"
			@blur="handlerBlur" 
			@clear="handlerClear"
			class="select-input"	
			:disabled="disabled"
	  	:suffix-icon="visible?'el-icon-arrow-up':'el-icon-arrow-down'"
    >
		</el-input>
		<transition name="el-zoom-in-top" @after-leave="doDestroy">
			<el-select-menu v-show="visible" style="width:200px" ref="popper">
				<el-scrollbar tag="ul" ref="scrollbar"  v-show="(options.length != 0 )"
					wrap-class="el-select-dropdown__wrap" view-class="el-select-dropdown__list"
					@click.native="clickScroll">
					<div>
						<div :style="{height: `${topHiddenBlock}px`}"></div>
						<render ref="optionListRef" :render="renderTable"></render>
						<div :style="{height: `${bottomHiddenBlock}px`}"></div>
					</div>
				</el-scrollbar>
				<template v-if="(options.length === 0 )">
					<p class="el-select-dropdown__empty" >暂无数据</p>
				</template>
			</el-select-menu>
		</transition>
  </div>
</template>

<script>
import ElSelectMenu from "./elSelectMenu.vue";
import MineOption from "./mineOption.js";
import render from "./render";
export default {
	name:'BigDataSelect',
	components: {
		ElSelectMenu,
		MineOption,
		render
	},
	data() {
		return {
			options: [],//等待渲染的集合
			visible: false,//是否显示
			scrollTop: 0,//滚动条的定位
			topHiddenBlock: 0,//顶部预置高度
			//三个VNode集合交替轮换显示时，增减预置高度，
			//使得滚动条总高度不变可以依次往下而不会回缩
			domHeight: 0,//整个待渲染区总高度
			time0: 0,//一个组显示过几次
			time1: 0,
			time2: -1,
			
			currentIndex: 0, //当前显示的是第几个table组，通过scrollTop和table高度得到
			groupHeightList: [],//每一个组的高度对象集，这么弄只是为了方便处理，也可以用其他方式保存组高度
			groupIndex: 0, //当前滚动到了第几个index，不取模
			inputlabel: undefined,//回显的内容
			inputvalue: this.value === undefined || this.value === null? '': this.value,//选定的Value值
			currentSelectRow: undefined,//选定的row
			menuVisibleOnFocus: false,//判别是否点击在组件上，如果是点击在这上面，则不应该在blur之后关闭下拉列表
			selectting:false,//是否是选择状态，如果是选择状态下的点击，应该在触发blur后关闭下拉列表
			setting:false,//避免在设定scrollTop时触发blur
			itemHeight: 34,//一个item的高度
			showNumber:20,//一个组渲染的默认值
		};
	},
	props: {
		value:{
			default: undefined,
		},
		placeholder:{
			default: "请输入内容",
			type:String,
		}, 
		dataList: {
			default: []
		},
		disabled:{
			type:Boolean,
		},
		labelName: {
			default: "label",
			type:String,
		},
		valueName: {
			default: "value",
			type:String,
		},
		keyName: {
			default: "value",
			type:String,
		},
	},
	watch: {
		scrollTop(top) {
			//  当前滚动条是在三个table中的哪一个
			let height = 0;
			//  通过当前上部站位得到三个table最上一个table的是哪个组
			// 获取groupIndex和currentIndex
			for (let i in this.groupHeightList) {
				if (
					top >= height &&
					top < height + (this.groupHeightList[i] ? this.groupHeightList[i] : 0)
				) {
				this.groupIndex = +i;
				break;
				}
				height += this.groupHeightList[i];
			}
			this.currentIndex = this.groupIndex % 3;


			this.$nextTick(() => {
				this.setTopPlace();
			});
		},
		visible(val) {
			if (!val) {
				this.menuVisibleOnFocus = false;
				this.setScrollTop();
			}else{
				this.options = this.dataList;
				this.setScrollTop(this.currentSelectRow);
			}
		},
		inputlabel(val) {
			this.debounce(()=>{
				if (val != undefined && val != "") {
					if (this.dataList.length > 0) {
					let data = this.dataList.filter((item, index) => {
						return  (item[this.labelName]+'').toLowerCase().indexOf(val.toLowerCase()) > -1;
					});
						this.options = data;
					} else {
						this.options = [];
					}
				} else {
					this.options = this.dataList;
				}
				this.setScrollTop();
			})();
		},
		dataList(val) {
			if (!!val) this.options = val;
			else this.options = [];
		},
		/**
		 * 
		 * @param {Array} val 
		 * 监听用于选择的集合
		 */
		options(val){
			if(val){
				this.groupHeightList = this.initGroupHeightList(val);
				this.domHeight = val.length * this.itemHeight;
				this.scrollTop = 0;
			}else{
				this.groupHeightList = {0:0};
				this.domHeight = 0;
				this.scrollTop = 0;
			}
		},
		currentSelectRow(val){
			if(!!val){
				this.inputvalue = val[this.valueName];
			}else{
				this.inputvalue = undefined;
			}
			this.$emit('input',this.inputvalue)
		},
		value(val, oldValue) {
			this.setCurrentDataRow(val);
		},
	},
	created() {
		this.options = this.dataList;
		this.setCurrentDataRow(this.value);
	},
	computed: {
		bottomHiddenBlock: function() {
			//底部预置位高度，placeholderHeight-顶部预置位
			let bottomTemp = this.placeholderHeight - this.topHiddenBlock < 0 ? 
				0 : this.placeholderHeight - this.topHiddenBlock;
			return bottomTemp
		},
		placeholderHeight() {
			let mdHeight = 0; //  当前三块总高度
			let arr = [];
			for (let i in this.groupHeightList) {
				arr[i] = this.groupHeightList[i];
			}
			arr = arr.slice(this.groupIndex, +this.groupIndex + 3);
			for (let n of arr) {
				mdHeight += n;
			}
			let placeTemp = this.domHeight - mdHeight; // 占位容器的总高度(上 + 下)
			return placeTemp;
		}
	},
	mounted() {
		let barDom = this.$refs.scrollbar.$el
		barDom.addEventListener("scroll", this.handleScroll, true);
		this.groupHeightList = this.initGroupHeightList(this.options);
		this.domHeight = this.options.length * this.itemHeight;
	},
	methods: {

		/**	
		 * VNode数组相关处理方法
		 */

		/**
		 * 设定新的显示VNode组，同时交替旧的组
		 */
		setDataTable(h, prop) {
			// times0: this.times0,
			//计算table  ，VNodeList
			let table1 = this.getItemTable(h, this.options, 0, prop);
			let table2 = this.getItemTable(h, this.options, 1, prop);
			let table3 = this.getItemTable(h, this.options, 2, prop);
			//切换位置，因为渲染vue特性，相同的会被复用，不用每一个都计算
			if (this.currentIndex === 0) return [table1, table2, table3];
			else if (this.currentIndex === 1) return [table2, table3, table1];
			else return [table3, table1, table2];
		},
		//  三个Vnode组的外包装
		renderTable(h, prop) {
			return h("div", this.setDataTable(h, prop));
		},

		//  生成VNode组
		getItemTable(h, data, index, prop) {
			return h(MineOption, {
				style: { width: "100%" },
				props: {
					data: data,
					time0: this.time0,
					time1: this.time1,
					time2: this.time2,
					tag: prop.tag,
					itemNum: this.showNumber,
					tableIndex: index,
					groupIndex: +this.groupIndex,
					itemRowHeight: this.itemHeight,
					labelName: this.labelName,
					valueName: this.valueName,
					keyName: this.keyName,
					currentSelectRow:this.currentSelectRow,
				},
				on:{
					changeSelect:this.changeSelect,
				},
				key: "table-item-key" + index,
				ref: "itemTable" + index,
				attrs: {
				"data-index": index
				}
			});
		},
		//初始化计算各个组的高度
		initGroupHeightList(data) {	
			let height = 0;
			let l = data.length;
			if(l*this.itemHeight>=250){
				height = 258;
			}else{
				height = l*this.itemHeight;
			}
			//  分组数据
			let moduleNb = 0;
			moduleNb = 3 * Math.ceil(height / this.itemHeight);
			this.showNumber = moduleNb;
			let groupHeight = {};
			if (data.length > moduleNb) {
				for (let i in data) {
				let nb = (+i + 1) * moduleNb;
				if (nb > data.length) {
					groupHeight[i] = (data.length % moduleNb) * this.itemHeight;
					break;
				}
				groupHeight[i] = moduleNb * this.itemHeight;
				}
			} else {
				groupHeight[0] = data.length * this.itemHeight;
			}
			return groupHeight;
		},


		/**
		 * 工具方法
		 */

		//  设置顶部预置定位并计算显示次数time
		setTopPlace() {
			let scrollTop = this.scrollTop;
			let t0 = 0;
			let t1 = 0;
			let t2 = 0;
			if (scrollTop > this.groupHeightList[0]) {
				//计算三个time
				switch (this.currentIndex) {
				case 0:
					t0 = parseInt(this.groupIndex / 3);
					t1 = t2 = t0;
					break;
				case 1:
					t1 = parseInt(this.groupIndex / 3);
					t0 = t1 + 1;
					t2 = t1;
					break;
				case 2:
					t2 = parseInt(this.groupIndex / 3);
					t0 = t1 = t2 + 1;
				}
			}
			this.time0 = t0;
			this.time1 = t1;
			this.time2 = t2;
			
			//计算预置位高度
			let height = 0;
			for (let i in this.groupHeightList) {
				if (+i === +this.groupIndex) {
				break;
				}
				height += this.groupHeightList[i];
			}
			this.topHiddenBlock = height;
		},

		//设定滚动条的位置
		setScrollTop(row){
			
			//标记设定scroll的状态
			if(row!=undefined && row != ""){
				let index = 0;
				let tempData = this.options.find((item, i) => {
					if(row[this.keyName] === item[this.keyName]){
						index = i;
						return true;
					}
				});
				this.$nextTick(()=>{
					if(this.$refs.scrollbar){
						if(tempData){
							this.$refs.scrollbar.wrap.scrollTop = index*this.itemHeight;
							// this.$refs.scrollbar.wrap.scrollTop = 0;
						}else{
							this.$refs.scrollbar.wrap.scrollTop = 0;
						}
					}
				})
			}else{
				this.$nextTick(()=>{
					if(this.$refs.scrollbar){
						this.$refs.scrollbar.wrap.scrollTop = 0;
					}
				})
			}
		},

		//设定当前选中的值，根据value显示相关的label
		setCurrentDataRow(val){
			let tempData = this.dataList.find((item,index)=>{
				return item[this.valueName] === val;
			})
			this.currentSelectRow = tempData;
			if(tempData!=undefined){
				this.inputlabel = tempData[this.labelName];
			}else{
				this.inputlabel = "";
			}
		},

		//函数去抖
		debounce(fn,delay){
			var delay=delay||200;
			var timer;
			return function(){
				var th=this;
				var args=arguments;
				if (timer) {
						clearTimeout(timer);
				}
				timer=setTimeout(
					function () {
						timer=null;
						fn.apply(th,args);
				}, delay);
			};
		},


		/**
		 * 事件
		 */

		clickScroll(){
			//点击scroll时
			this.menuVisibleOnFocus = true;
		},
		

		handleScroll(e) {
			const ele = e.srcElement || e.target;
			const { scrollTop, scrollLeft } = ele;
			this.scrollTop = scrollTop;
		},

		changeSelect(data) {
			//选择具体某个值时允许关闭选择框
			this.inputlabel = data[this.labelName];
			this.currentSelectRow = data;
			this.menuVisibleOnFocus = false;
			this.selectting = true;
			this.visible = false;
		},

		handleFocus(event) {
			this.visible = true;
			this.menuVisibleOnFocus = false;
		},
		handlerBlur() {
			setTimeout(()=>{
				if (!this.menuVisibleOnFocus){
					this.visible = false;
					if(this.currentSelectRow!=undefined){
						this.inputlabel = this.currentSelectRow[this.labelName];
					}else{
						this.inputlabel = "";
					}
					
				}else{
					this.menuVisibleOnFocus = false;
					if(!this.selectting)
						this.$refs.reference.$el.querySelector("input").focus();
				}
			},200)
		},
		handlerClear() {
			this.inputlabel = undefined;
			this.currentSelectRow = undefined;
		},
		doDestroy() {
			this.$refs.popper && this.$refs.popper.doDestroy();
		},
	
	},
	deactivated() {
		this.visible = false;
	},
	beforeDestroy() {
		let barDom = this.$refs.scrollbar.$el
		barDom.removeEventListener("scroll", this.handleScroll);
		this.options = undefined;
		this.visible = false;
	}
};
</script>
<style>
.el-select-dropdown__item.mineSelected {
  color: #409eff !important;
}
.select-input input:hover{
	cursor: pointer;
}
</style>