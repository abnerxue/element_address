import wlAddress from "./index.vue";

// 为组件提供 install 安装方法，供按需引入
wlAddress.install = function(Vue) {
  Vue.component(wlAddress.name, wlAddress);
};

// 默认导出组件
export default wlAddress;
