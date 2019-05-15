export default {
    name: 'renderDom',
    functional: true,
    props: {
      render: Function,
      tag: {
        default:"li",
      },
    },
    data(){
      return{
      }
    },
    methods: {
    },
    render: (h, ctx) => {
      //因为加了 functional: true,
      // 所以用ctx指向this
      return ctx.props.render(h,
        ctx.parent);
    }
  };
  