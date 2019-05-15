<template>
  	<div id="app">
	  	<h3>Select:</h3>
		<big-data-select  :dataList="dataList" v-model="id"
			labelName="name" valueName="id" keyName="id"></big-data-select>
		<h3>Table:</h3>
		<big-data-table :data="dataList"
			border fit highlight-current-row :height="table_height" style="width: 50%;">
			<el-table-column align="center" label="采集点ID" prop="id"></el-table-column>
			<el-table-column align="center" label="采集点ID" prop="name"></el-table-column>
		</big-data-table>
	

  </div>
</template>

<script>
import BigDataTable from './components/BigDataTable'
import BigDataSelect from './components/BigDataSelect'

export default {
	name: 'app',
	components: {
			BigDataTable,
			BigDataSelect
	},
	data(){
		return{
			id:3,
			dataList:[],
			table_height:600,
		}
	},

	created(){
		for(let i=0;i<10000;i++){
			this.dataList.push({
				id:i,
				name:`label-${i}`
			})
		}
	},
}
</script>

<style lang="scss">







</style>
