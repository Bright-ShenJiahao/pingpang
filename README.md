# 乒乓

南方小城老球馆经营 + 学员养成的网页小游戏（原型阶段）。

- 打开 `index.html` 即可运行；网址后加 `?debug` 显示调试工具栏（训练/比赛场地、开局/修好、横竖屏、网格）。
- `js/game.js`：渲染（球馆全景、比赛特写、人物动作）
- `js/sim.js`：经营循环（时段结算、训练成长、收支、人气、设施、存档）和界面
- `js/guide.js`：导出美术参考图（`index.html#guide-bg` / `#guide-props`）
- `js/assets.js`：素材清单（路径 + 脚底锚点）
- `assets/chars` 人物（`_close` 比赛特写用 72px/米，`_hall` 全景尺寸参考 28px/米）
- `assets/props` 球台、挡板、灯、柜台等道具；`assets/scenes` 背景
