import Vue from "vue";
import {
  Dialog,
  Form,
  FormItem,
  Button,
  Input,
  Message,
  MessageBox,
  Table,
  TableColumn,
  Image,
  Icon,
  Carousel,
  CarouselItem,
  Row,
  Col,
  Tag,
} from "element-ui";
import "element-ui/lib/theme-chalk/index.css";
Vue.use(Dialog);
Vue.use(Form);
Vue.use(FormItem);
Vue.use(Button);
Vue.use(Input);
Vue.use(Table);
Vue.use(TableColumn);
Vue.use(Image);
Vue.use(Icon);
Vue.use(Carousel);
Vue.use(CarouselItem);
Vue.use(Row);
Vue.use(Col);
Vue.use(Tag);
//Vue.use(Message)
// 挂载到$message上
Vue.prototype.$message = Message;
Vue.prototype.$confirm = MessageBox.confirm;
