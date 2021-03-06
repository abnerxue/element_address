<template>
  <div class="wl-address" v-if="selfType">
    <el-select
      @change="provinceChange"
      v-model="province_act"
      placeholder="请选择省份"
      value-key="code"
      :size="size"
    >
      <el-option
        v-for="item in provinces"
        :key="item.code"
        :label="item.name"
        :value="item"
      >
      </el-option>
    </el-select>
    <el-select
      v-model="city_act"
      :size="size"
      value-key="code"
      placeholder="请选择城市"
      @change="citysChange"
    >
      <el-option
        v-for="item in citys"
        :key="item.code"
        :label="item.name"
        :value="item"
      >
      </el-option>
    </el-select>
    <el-select
      v-model="county_act"
      :size="size"
      value-key="code"
      placeholder="请选择区/县"
      @change="countysChange"
    >
      <el-option
        v-for="item in countys"
        :key="item.code"
        :label="item.name"
        :value="item"
      >
      </el-option>
    </el-select>
  </div>
  <el-cascader
    v-else
    v-model="cascader_val"
    :size="size"
    :options="provinces"
    :props="cascader_props"
    @change="getCascaderVal"
    @active-item-change="handleItemChange"
  ></el-cascader>
</template>
<script>
import { getProvince, getCity, getCounty } from "./address.js"; // 导入获取省市县

export default {
  name: "wlAddress",
  data() {
    return {
      provinces: [], // 省份
      citys: [], // 市
      countys: [], // 县
      province_act: {
        code: "",
        name: ""
      }, // 当前省
      city_act: {
        code: "",
        name: ""
      }, // 当前省
      county_act: {
        code: "",
        name: ""
      }, // 当前省
      cascader_props: {
        label: "name",
        value: "code",
        children: "children"
      },
      cascader_val: [] // 级联选中值
    };
  },
  props: {
    // 输入框尺寸
    size: {
      type: String,
      default: ""
    },
    // 地址类型 default默认 cascader级联选择器
    type: {
      type: String,
      default: "default"
    },
    // 默认数据
    address: {
      type: String,
      default: ""
    }
  },
  created() {
    this.provinces = getProvince();
    this.analysisDefaultAddress();
  },
  methods: {
    // 级联选择动态获取下级
    handleItemChange(val) {
      let [p_code, c_code] = val;
      if (c_code) {
        let act_city = this.citys.find(item => item.code === c_code);
        if (act_city.children.length > 0) return;
        this.countys = getCounty(act_city);
        act_city.children = this.countys;
      } else {
        let act_province = this.provinces.find(item => item.code === p_code);
        if (act_province.children.length > 0) return;
        this.citys = getCity(act_province, true);
        act_province.children = this.citys;
      }
    },
    // 选择完毕数据组装
    getCascaderVal(val) {
      let [pro, cit, con] = val;
      this.province_act = this.provinces.find(item => item.code === pro);
      if (con) {
        this.city_act = this.province_act.children.find(
          item => item.code === cit
        );
        this.county_act = this.city_act.children.find(
          item => item.code === con
        );
      } else {
        this.city_act = this.province_act;
        this.county_act = this.city_act.children.find(
          item => item.code === cit
        );
      }

      let { code: pro_code, name: pro_name } = this.province_act;
      let { code: cit_code, name: cit_name } = this.city_act;
      let { code: cou_code, name: cou_name } = this.county_act;
      let string_address = JSON.stringify([
        { code: pro_code, name: pro_name },
        { code: cit_code, name: cit_name },
        { code: cou_code, name: cou_name }
      ]);
      this.$emit("update:address", string_address);
    },
    // 省份更改
    provinceChange(val) {
      this.city_act = {
        code: "",
        name: ""
      };
      this.county_act = {
        code: "",
        name: ""
      };
      this.countys = [];
      this.citys = getCity(val);
    },
    // 城市更改
    citysChange(val) {
      this.county_act = {
        code: "",
        name: ""
      };
      this.countys = getCounty(val);
    },
    // 县更改
    countysChange(val) {
      let string_address = JSON.stringify([
        this.province_act,
        this.city_act,
        this.county_act
      ]);
      this.$emit("update:address", string_address);
    },
    // 解析默认地址
    analysisDefaultAddress() {
      if (!this.address) return;
      let address = "";
      try {
        address = JSON.parse(this.address) || [];
      } catch (error) {
        console.log("地址信息不合规范:" + error);
      }
      let data_format = address instanceof Array;
      if (!data_format) return;
      if (this.type === "default") {
        [
          this.province_act = {},
          this.city_act = {},
          this.county_act = {}
        ] = address;

        if (this.province_act.code) {
          this.citys = getCity(this.province_act);
        }

        if (this.city_act.code) {
          this.countys = getCounty(this.city_act);
        }
      } else {
        let [pro, cit, con] = address;
        this.cascader_val =
          pro.code !== cit.code
            ? address.map(item => item.code)
            : [pro.code, con.code];
        this.cascaderData(this.cascader_val);
      }
    },
    // 处理默认地址时级联数据
    cascaderData(val) {
      let [p_code, c_code, n_code] = val;
      let act_province = this.provinces.find(item => item.code === p_code);
      this.citys = getCity(act_province, true);
      act_province.children = this.citys;
      if (n_code) {
        let act_city = this.citys.find(item => item.code === c_code);
        this.countys = getCounty(act_city);
        act_city.children = this.countys;
      }
    }
  },
  watch: {
    address(val) {
      this.analysisDefaultAddress();
    }
  },
  computed: {
    selfType() {
      return this.type === "default";
    }
  }
};
</script>

<style lang="css">
.wl-address{
  display: flex;
  justify-content: space-between;
}

.wl-address .el-select{
  flex: 0.31;
}
</style>
