import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetUno,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      warn: true,
    }),
  ],
  transformers: [
    transformerDirectives(),     // 支持 @apply 指令
    transformerVariantGroup(),   // 支持 hover:(bg-gray-100 text-black) 分组语法
  ],
  shortcuts: {
    'btn': 'px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 cursor-pointer transition-all shadow-[0_4px_14px_0_rgba(255,144,0,0.39)] hover:shadow-[0_6px_20px_rgba(255,144,0,0.23)] hover:-translate-y-0.5',
    'btn-outline': 'px-4 py-2 rounded-xl border border-transparent bg-white/50 text-gray-700 hover:bg-white hover:shadow-lg hover:shadow-gray-200/40 cursor-pointer transition-all backdrop-blur-md',
    'input-base': 'px-3 py-2 border-none bg-white/60 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white/90 transition-all shadow-inner',
    'card-hover': 'rounded-2xl border-none bg-white/60 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300',
    'flex-center': 'flex items-center justify-center',
    'flex-between': 'flex items-center justify-between',
    'text-ellipsis': 'truncate overflow-hidden',
  },
  theme: {
    colors: {
      primary: '#ff9000',
    },
  },
  safelist: [
    // 确保动画类名不被清除
    'animate-bounce',
    'animate-spin',
    'animate-pulse',
  ],
})
