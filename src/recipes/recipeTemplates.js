/**
 * Recipe template library for the "AI Smart Kitchen".
 *
 * Each template declares `tags` from the canonical signal vocabulary in
 * `recipeSignals.js`. The engine scores templates against the tags it extracts
 * from the user's soon-to-expire products, then surfaces the best matches.
 *
 * All user-facing strings are keyed by language so the whole thing is trilingual.
 * Icons reference lucide component names resolved in `RecipeCard.jsx`.
 */

/**
 * @typedef {Object} RecipeTemplate
 * @property {string} id
 * @property {string} icon            lucide icon key, see ICONS in RecipeCard
 * @property {string} emoji
 * @property {string[]} tags          canonical ingredient signals
 * @property {number} time            minutes
 * @property {number} servings
 * @property {'easy'|'medium'|'hard'} difficulty
 * @property {{uz:string,en:string,ru:string}} title
 * @property {{uz:string[],en:string[],ru:string[]}} ingredients
 * @property {{uz:string[],en:string[],ru:string[]}} steps
 */

/** @type {RecipeTemplate[]} */
export const RECIPE_TEMPLATES = [
  {
    id: 'cheese-omelette',
    icon: 'egg',
    emoji: '🍳',
    tags: ['egg', 'dairy', 'cheese', 'fat'],
    time: 12,
    servings: 2,
    difficulty: 'easy',
    title: {
      uz: 'Pishloqli omlet',
      en: 'Cheesy omelette',
      ru: 'Омлет с сыром',
    },
    ingredients: {
      uz: ["3 ta tuxum", '50 g pishloq', '2 osh qoshiq sut', 'Sariyog‘ yoki zaytun moyi', 'Tuz va murch'],
      en: ['3 eggs', '50 g cheese', '2 tbsp milk', 'Butter or olive oil', 'Salt and pepper'],
      ru: ['3 яйца', '50 г сыра', '2 ст. л. молока', 'Сливочное или оливковое масло', 'Соль и перец'],
    },
    steps: {
      uz: [
        'Tuxumni sut, tuz va murch bilan ko‘pirtirib aralashtiring.',
        'Pishloqni mayda qirg‘ichda qiring.',
        'Tovada moyni qizdirib, aralashmani quying.',
        'Pishloqni yarmiga seping, ikki buklab, 1–2 daqiqa pishiring.',
      ],
      en: [
        'Whisk the eggs with the milk, salt and pepper.',
        'Grate the cheese finely.',
        'Heat the oil in a pan and pour in the egg mixture.',
        'Sprinkle the cheese over one half, fold and cook for 1–2 minutes.',
      ],
      ru: [
        'Взбейте яйца с молоком, солью и перцем.',
        'Натрите сыр на мелкой тёрке.',
        'Разогрейте масло на сковороде и влейте яичную смесь.',
        'Посыпьте сыром половину, сложите пополам и готовьте 1–2 минуты.',
      ],
    },
  },
  {
    id: 'milk-pancakes',
    icon: 'cookie',
    emoji: '🥞',
    tags: ['dairy', 'egg', 'grain', 'fat'],
    time: 25,
    servings: 4,
    difficulty: 'easy',
    title: {
      uz: 'Sutli quymoq (pankeyk)',
      en: 'Milk pancakes',
      ru: 'Блины на молоке',
    },
    ingredients: {
      uz: ['250 ml sut', '1 ta tuxum', '150 g un', '1 osh qoshiq shakar', 'Bir chimdim tuz', 'Pishirish uchun moy'],
      en: ['250 ml milk', '1 egg', '150 g flour', '1 tbsp sugar', 'A pinch of salt', 'Oil for frying'],
      ru: ['250 мл молока', '1 яйцо', '150 г муки', '1 ст. л. сахара', 'Щепотка соли', 'Масло для жарки'],
    },
    steps: {
      uz: [
        'Sut, tuxum, shakar va tuzni aralashtiring.',
        'Unni elakdan o‘tkazib, silliq xamir qilib qo‘shing.',
        'Xamirni 10 daqiqa tindiring.',
        'Qizdirilgan tovada ikki tomonini oltin rangga qadar pishiring.',
      ],
      en: [
        'Whisk the milk, egg, sugar and salt together.',
        'Sift in the flour and whisk to a smooth batter.',
        'Rest the batter for 10 minutes.',
        'Fry in a hot pan until golden on both sides.',
      ],
      ru: [
        'Смешайте молоко, яйцо, сахар и соль.',
        'Просейте муку и размешайте до однородного теста.',
        'Дайте тесту отдохнуть 10 минут.',
        'Обжарьте на разогретой сковороде до золотистого цвета с двух сторон.',
      ],
    },
  },
  {
    id: 'french-toast',
    icon: 'sandwich',
    emoji: '🍞',
    tags: ['bread', 'egg', 'dairy', 'sweet'],
    time: 15,
    servings: 2,
    difficulty: 'easy',
    title: {
      uz: 'Fransuzcha tost',
      en: 'French toast',
      ru: 'Французский тост',
    },
    ingredients: {
      uz: ['4 bo‘lak non', '2 ta tuxum', '100 ml sut', '1 osh qoshiq shakar', 'Dolchin', 'Sariyog‘'],
      en: ['4 slices of bread', '2 eggs', '100 ml milk', '1 tbsp sugar', 'Cinnamon', 'Butter'],
      ru: ['4 ломтика хлеба', '2 яйца', '100 мл молока', '1 ст. л. сахара', 'Корица', 'Сливочное масло'],
    },
    steps: {
      uz: [
        'Tuxum, sut, shakar va dolchinni bir idishda ko‘pirtiring.',
        'Non bo‘laklarini aralashmaga ikki tomonini botirib oling.',
        'Tovada sariyog‘ni eritib, nonlarni qizartiring.',
        'Asal yoki murabbo bilan torting.',
      ],
      en: [
        'Whisk the eggs, milk, sugar and cinnamon in a shallow dish.',
        'Dip each slice of bread on both sides.',
        'Melt the butter in a pan and fry the slices until golden.',
        'Serve with honey or jam.',
      ],
      ru: [
        'Взбейте яйца, молоко, сахар и корицу в плоской посуде.',
        'Обмакните каждый ломтик хлеба с двух сторон.',
        'Растопите масло на сковороде и обжарьте хлеб до золотистого цвета.',
        'Подавайте с мёдом или вареньем.',
      ],
    },
  },
  {
    id: 'grilled-cheese',
    icon: 'sandwich',
    emoji: '🧀',
    tags: ['bread', 'cheese', 'dairy', 'fat'],
    time: 10,
    servings: 1,
    difficulty: 'easy',
    title: {
      uz: 'Qizdirilgan pishloqli sendvich',
      en: 'Grilled cheese sandwich',
      ru: 'Горячий сэндвич с сыром',
    },
    ingredients: {
      uz: ['2 bo‘lak non', '70 g pishloq', 'Sariyog‘', 'Bir chimdim quruq sarimsoq', 'Xohishga ko‘ra pomidor'],
      en: ['2 slices of bread', '70 g cheese', 'Butter', 'A pinch of garlic powder', 'Tomato, optional'],
      ru: ['2 ломтика хлеба', '70 г сыра', 'Сливочное масло', 'Щепотка сушёного чеснока', 'Помидор по желанию'],
    },
    steps: {
      uz: [
        'Nonning tashqi tomoniga sariyog‘ surting.',
        'Pishloqni bo‘laklarga bo‘lib, non orasiga joylang.',
        'Qopqoqli tovada ikki tomonini oltin rangga qadar pishiring.',
        'Pishloq erib ketgach, issiq holda torting.',
      ],
      en: [
        'Butter the outside of both bread slices.',
        'Layer the cheese between the slices.',
        'Cook in a covered pan, flipping once, until golden.',
        'Serve hot as soon as the cheese melts.',
      ],
      ru: [
        'Смажьте маслом наружную сторону ломтиков хлеба.',
        'Выложите сыр между ломтиками.',
        'Обжаривайте под крышкой, переворачивая, до золотистого цвета.',
        'Подавайте горячим, как только сыр расплавится.',
      ],
    },
  },
  {
    id: 'fruit-smoothie',
    icon: 'cup',
    emoji: '🥤',
    tags: ['fruit', 'dairy', 'sweet'],
    time: 5,
    servings: 2,
    difficulty: 'easy',
    title: {
      uz: 'Mevali smuzi',
      en: 'Fruit smoothie',
      ru: 'Фруктовый смузи',
    },
    ingredients: {
      uz: ['2 ta banan yoki 2 ta olma', '200 ml sut yoki qatiq', '1 osh qoshiq asal', 'Muz bo‘lakchalari', 'Dolchin'],
      en: ['2 bananas or 2 apples', '200 ml milk or yogurt', '1 tbsp honey', 'Ice cubes', 'Cinnamon'],
      ru: ['2 банана или 2 яблока', '200 мл молока или йогурта', '1 ст. л. мёда', 'Кубики льда', 'Корица'],
    },
    steps: {
      uz: [
        'Mevalarni tozalab, bo‘laklarga bo‘ling.',
        'Barcha masalliqlarni blender ichiga soling.',
        '1 daqiqa yuqori tezlikda aralashtiring.',
        'Stakanga quyib, darhol torting.',
      ],
      en: [
        'Peel and chop the fruit.',
        'Add everything to a blender.',
        'Blend on high for about a minute.',
        'Pour into glasses and serve straight away.',
      ],
      ru: [
        'Очистите и нарежьте фрукты.',
        'Положите все ингредиенты в блендер.',
        'Взбивайте на высокой скорости около минуты.',
        'Разлейте по стаканам и подавайте сразу.',
      ],
    },
  },
  {
    id: 'cheese-pasta',
    icon: 'soup',
    emoji: '🍝',
    tags: ['grain', 'dairy', 'cheese', 'fat'],
    time: 20,
    servings: 3,
    difficulty: 'easy',
    title: {
      uz: 'Pishloqli qaymoqli makaron',
      en: 'Creamy cheese pasta',
      ru: 'Паста с сырным соусом',
    },
    ingredients: {
      uz: ['300 g makaron', '150 ml sut yoki qaymoq', '100 g pishloq', '20 g sariyog‘', 'Tuz, murch, muskat yong‘og‘i'],
      en: ['300 g pasta', '150 ml milk or cream', '100 g cheese', '20 g butter', 'Salt, pepper, nutmeg'],
      ru: ['300 г пасты', '150 мл молока или сливок', '100 г сыра', '20 г сливочного масла', 'Соль, перец, мускатный орех'],
    },
    steps: {
      uz: [
        'Makaronni tuzli suvda al dente holida qaynatib, suvini torting.',
        'Tovada sariyog‘ni eritib, sut quying.',
        'Pishloqni qo‘shib, past olovda eritib aralashtiring.',
        'Makaronni sousga qo‘shib, ziravorlar bilan torting.',
      ],
      en: [
        'Boil the pasta in salted water until al dente, then drain.',
        'Melt the butter in a pan and pour in the milk.',
        'Add the cheese and stir over low heat until melted.',
        'Toss the pasta in the sauce and season to taste.',
      ],
      ru: [
        'Отварите пасту в подсоленной воде до аль денте и слейте.',
        'Растопите масло на сковороде и влейте молоко.',
        'Добавьте сыр и, помешивая, растопите на слабом огне.',
        'Смешайте пасту с соусом и приправьте по вкусу.',
      ],
    },
  },
  {
    id: 'fried-rice',
    icon: 'soup',
    emoji: '🍚',
    tags: ['grain', 'egg', 'vegetable', 'fat'],
    time: 18,
    servings: 3,
    difficulty: 'medium',
    title: {
      uz: 'Sabzavotli qovurilgan guruch',
      en: 'Vegetable fried rice',
      ru: 'Жареный рис с овощами',
    },
    ingredients: {
      uz: ['2 stakan qaynatilgan guruch', '2 ta tuxum', '1 ta sabzi', '1 ta piyoz', '2 osh qoshiq moy', 'Soya sousi'],
      en: ['2 cups cooked rice', '2 eggs', '1 carrot', '1 onion', '2 tbsp oil', 'Soy sauce'],
      ru: ['2 стакана варёного риса', '2 яйца', '1 морковь', '1 лук', '2 ст. л. масла', 'Соевый соус'],
    },
    steps: {
      uz: [
        'Piyoz va sabzini mayda to‘g‘rab, moyda qovuring.',
        'Tuxumni alohida qovurib, chetga oling.',
        'Guruchni qo‘shib, yuqori olovda 3–4 daqiqa qovuring.',
        'Tuxum va soya sousini qo‘shib, yaxshilab aralashtiring.',
      ],
      en: [
        'Dice the onion and carrot and fry in the oil.',
        'Scramble the eggs separately and set aside.',
        'Add the rice and stir-fry over high heat for 3–4 minutes.',
        'Return the eggs, add soy sauce and mix well.',
      ],
      ru: [
        'Нарежьте лук и морковь и обжарьте в масле.',
        'Отдельно обжарьте яйца и отложите.',
        'Добавьте рис и обжаривайте на сильном огне 3–4 минуты.',
        'Верните яйца, добавьте соевый соус и хорошо перемешайте.',
      ],
    },
  },
  {
    id: 'vegetable-soup',
    icon: 'soup',
    emoji: '🥣',
    tags: ['vegetable', 'herb', 'fat', 'grain'],
    time: 35,
    servings: 4,
    difficulty: 'easy',
    title: {
      uz: 'Sabzavotli sho‘rva',
      en: 'Vegetable soup',
      ru: 'Овощной суп',
    },
    ingredients: {
      uz: ['2 ta sabzi', '2 ta kartoshka', '1 ta piyoz', '1 ta pomidor', '1,5 l suv', 'Tuz, ziravorlar, ko‘katlar'],
      en: ['2 carrots', '2 potatoes', '1 onion', '1 tomato', '1.5 l water', 'Salt, spices, fresh herbs'],
      ru: ['2 моркови', '2 картофелины', '1 луковица', '1 помидор', '1,5 л воды', 'Соль, специи, зелень'],
    },
    steps: {
      uz: [
        'Piyoz va sabzini to‘g‘rab, moyda qovuring.',
        'Suv quyib, qaynagach kartoshkani qo‘shing.',
        '15 daqiqadan so‘ng pomidor va ziravorlarni qo‘shing.',
        'Tayyor bo‘lgach, ko‘katlar sepib torting.',
      ],
      en: [
        'Chop the onion and carrot, then soften them in oil.',
        'Add the water, and once boiling add the potatoes.',
        'After 15 minutes add the tomato and spices.',
        'Finish with fresh herbs and serve.',
      ],
      ru: [
        'Нарежьте лук и морковь и обжарьте в масле.',
        'Влейте воду и после закипания добавьте картофель.',
        'Через 15 минут добавьте помидор и специи.',
        'Готовый суп посыпьте зеленью и подавайте.',
      ],
    },
  },
  {
    id: 'chicken-stirfry',
    icon: 'meat',
    emoji: '🍗',
    tags: ['meat', 'vegetable', 'fat', 'herb'],
    time: 25,
    servings: 3,
    difficulty: 'medium',
    title: {
      uz: 'Tovuqli sabzavotli qovurma',
      en: 'Chicken & vegetable stir-fry',
      ru: 'Курица с овощами',
    },
    ingredients: {
      uz: ['500 g tovuq filesi', '1 ta bolgar qalampiri', '1 ta piyoz', '2 osh qoshiq soya sousi', 'Moy', 'Ziravorlar'],
      en: ['500 g chicken fillet', '1 bell pepper', '1 onion', '2 tbsp soy sauce', 'Oil', 'Spices'],
      ru: ['500 г куриного филе', '1 болгарский перец', '1 луковица', '2 ст. л. соевого соуса', 'Масло', 'Специи'],
    },
    steps: {
      uz: [
        'Tovuqni ingichka bo‘laklarga bo‘ling va ziravorlab, 10 daqiqa tindiring.',
        'Sabzavotlarni yirik to‘g‘rab, yuqori olovda 3 daqiqa qovuring.',
        'Go‘shtni qo‘shib, oqarib ketguncha qovuring.',
        'Soya sousini quyib, yana 3 daqiqa qovurib, issiq torting.',
      ],
      en: [
        'Slice the chicken thinly, season and rest for 10 minutes.',
        'Chop the vegetables roughly and stir-fry for 3 minutes.',
        'Add the chicken and fry until it turns opaque.',
        'Pour in the soy sauce, cook for 3 more minutes and serve hot.',
      ],
      ru: [
        'Нарежьте курицу тонко, приправьте и оставьте на 10 минут.',
        'Крупно нарежьте овощи и обжарьте 3 минуты.',
        'Добавьте курицу и обжаривайте до изменения цвета.',
        'Влейте соевый соус, готовьте ещё 3 минуты и подавайте горячим.',
      ],
    },
  },
  {
    id: 'yogurt-bowl',
    icon: 'cup',
    emoji: '🍨',
    tags: ['dairy', 'fruit', 'sweet', 'grain'],
    time: 6,
    servings: 1,
    difficulty: 'easy',
    title: {
      uz: 'Qatiqli mevali piyola',
      en: 'Yogurt & fruit bowl',
      ru: 'Йогурт с фруктами',
    },
    ingredients: {
      uz: ['200 g qatiq yoki yogurt', '1 ta banan yoki olma', '1 osh qoshiq asal', 'Yong‘oqlar', 'Dolchin'],
      en: ['200 g yogurt', '1 banana or apple', '1 tbsp honey', 'Nuts', 'Cinnamon'],
      ru: ['200 г йогурта', '1 банан или яблоко', '1 ст. л. мёда', 'Орехи', 'Корица'],
    },
    steps: {
      uz: [
        'Qatiqni piyolaga soling.',
        'Mevalarni bo‘laklab, ustiga joylang.',
        'Asal va dolchin sepib, yong‘oq qo‘shing.',
      ],
      en: [
        'Spoon the yogurt into a bowl.',
        'Slice the fruit and arrange on top.',
        'Drizzle with honey, dust with cinnamon and add the nuts.',
      ],
      ru: [
        'Выложите йогурт в пиалу.',
        'Нарежьте фрукты и разложите сверху.',
        'Полейте мёдом, посыпьте корицей и добавьте орехи.',
      ],
    },
  },
  {
    id: 'bread-salad',
    icon: 'salad',
    emoji: '🥗',
    tags: ['bread', 'vegetable', 'cheese', 'herb', 'fat'],
    time: 12,
    servings: 2,
    difficulty: 'easy',
    title: {
      uz: 'Nonli sabzavotli salat',
      en: 'Bread & vegetable salad',
      ru: 'Салат с хлебом и овощами',
    },
    ingredients: {
      uz: ['2 bo‘lak non', '2 ta pomidor', '1 ta bodring', '50 g pishloq', 'Zaytun moyi', 'Ko‘katlar'],
      en: ['2 slices of bread', '2 tomatoes', '1 cucumber', '50 g cheese', 'Olive oil', 'Fresh herbs'],
      ru: ['2 ломтика хлеба', '2 помидора', '1 огурец', '50 г сыра', 'Оливковое масло', 'Зелень'],
    },
    steps: {
      uz: [
        'Nonni kubiklar shaklida to‘g‘rab, quruq tovada qizartiring.',
        'Sabzavotlarni bo‘laklab, kosa ichiga soling.',
        'Pishloq va ko‘katlarni qo‘shing.',
        'Zaytun moyi quyib, aralashtirib torting.',
      ],
      en: [
        'Cube the bread and toast it in a dry pan.',
        'Chop the vegetables and add them to a bowl.',
        'Add the cheese and fresh herbs.',
        'Drizzle with olive oil, toss and serve.',
      ],
      ru: [
        'Нарежьте хлеб кубиками и подсушите на сухой сковороде.',
        'Нарежьте овощи и положите в салатник.',
        'Добавьте сыр и зелень.',
        'Полейте оливковым маслом, перемешайте и подавайте.',
      ],
    },
  },
  {
    id: 'milk-porridge',
    icon: 'soup',
    emoji: '🥣',
    tags: ['dairy', 'grain', 'sweet'],
    time: 20,
    servings: 2,
    difficulty: 'easy',
    title: {
      uz: 'Sutli bo‘tqa',
      en: 'Creamy milk porridge',
      ru: 'Молочная каша',
    },
    ingredients: {
      uz: ['500 ml sut', '100 g guruch yoki suli', '1 osh qoshiq shakar', 'Bir chimdim tuz', 'Sariyog‘, dolchin'],
      en: ['500 ml milk', '100 g rice or oats', '1 tbsp sugar', 'A pinch of salt', 'Butter, cinnamon'],
      ru: ['500 мл молока', '100 г риса или овсянки', '1 ст. л. сахара', 'Щепотка соли', 'Масло, корица'],
    },
    steps: {
      uz: [
        'Sutni qaynatib, past olovga o‘tkazing.',
        'Donni yuvib, sekin-asta qo‘shib aralashtiring.',
        '15–20 daqiqa qopqoq ostida pishiring.',
        'Shakar, tuz va sariyog‘ qo‘shib, dolchin sepib torting.',
      ],
      en: [
        'Bring the milk to a boil, then lower the heat.',
        'Rinse the grains and stir them in gradually.',
        'Simmer covered for 15–20 minutes.',
        'Stir in the sugar, salt and butter, then dust with cinnamon.',
      ],
      ru: [
        'Доведите молоко до кипения и убавьте огонь.',
        'Промойте крупу и постепенно всыпьте, помешивая.',
        'Варите под крышкой 15–20 минут.',
        'Добавьте сахар, соль и масло, посыпьте корицей.',
      ],
    },
  },
  {
    id: 'fish-bake',
    icon: 'fish',
    emoji: '🐟',
    tags: ['fish', 'vegetable', 'herb', 'fat'],
    time: 30,
    servings: 2,
    difficulty: 'medium',
    title: {
      uz: 'Pechda pishirilgan baliq',
      en: 'Oven-baked fish',
      ru: 'Запечённая рыба',
    },
    ingredients: {
      uz: ['2 ta baliq filesi', '1 ta limon', '2 osh qoshiq zaytun moyi', 'Ziravorlar, ko‘katlar', 'Sabzavotlar'],
      en: ['2 fish fillets', '1 lemon', '2 tbsp olive oil', 'Spices, fresh herbs', 'Vegetables'],
      ru: ['2 рыбных филе', '1 лимон', '2 ст. л. оливкового масла', 'Специи, зелень', 'Овощи'],
    },
    steps: {
      uz: [
        'Pech 200°C gacha qizdirilsin.',
        'Baliqni ziravorlab, limon sharbati seping.',
        'Sabzavotlar bilan birga pishirish qog‘oziga o‘rang.',
        '18–20 daqiqa pishiring va darhol torting.',
      ],
      en: [
        'Preheat the oven to 200°C.',
        'Season the fish and squeeze over the lemon juice.',
        'Wrap it with the vegetables in baking paper.',
        'Bake for 18–20 minutes and serve immediately.',
      ],
      ru: [
        'Разогрейте духовку до 200°C.',
        'Приправьте рыбу и сбрызните лимонным соком.',
        'Заверните её с овощами в пергамент.',
        'Запекайте 18–20 минут и подавайте сразу.',
      ],
    },
  },
]

/**
 * Generic fallbacks used when nothing scores well but items are expiring.
 * They carry the special `__any__` tag, which matches every product.
 */
export const GENERIC_TEMPLATES = [
  {
    id: 'chef-surprise',
    icon: 'sparkles',
    emoji: '👨‍🍳',
    tags: ['__any__'],
    time: 20,
    servings: 2,
    difficulty: 'easy',
    generic: true,
    title: {
      uz: 'Oshpazning "muzlatgich kutilmasi"',
      en: 'Chef’s “fridge raid” skillet',
      ru: '«Хитрая сковорода» шефа',
    },
    ingredients: {
      uz: ['Muddati yaqin mahsulotlar', 'Piyoz yoki sarimsoq', 'Moy', 'Tuz va ziravorlar'],
      en: ['Your soon-to-expire items', 'Onion or garlic', 'Oil', 'Salt and spices'],
      ru: ['Продукты с истекающим сроком', 'Лук или чеснок', 'Масло', 'Соль и специи'],
    },
    steps: {
      uz: [
        'Muddati eng yaqin mahsulotlarni saralab oling.',
        'Piyozni moyda qovurib, asos tayyorlang.',
        'Mahsulotlarni yirik bo‘laklab, tovaga soling.',
        'Ko‘p qovurib, ziravorlar bilan mazali qilib torting.',
      ],
      en: [
        'Pick out the items that expire first.',
        'Fry the onion in oil to build a base.',
        'Roughly chop your items and add them to the pan.',
        'Stir-fry, season boldly and serve.',
      ],
      ru: [
        'Отберите продукты с самым близким сроком.',
        'Обжарьте лук в масле — это будет основа.',
        'Крупно нарежьте продукты и добавьте на сковороду.',
        'Обжарьте, приправьте и подавайте.',
      ],
    },
  },
  {
    id: 'everything-toast',
    icon: 'sandwich',
    emoji: '🥪',
    tags: ['__any__'],
    time: 10,
    servings: 1,
    difficulty: 'easy',
    generic: true,
    title: {
      uz: 'Hamma narsali tost',
      en: 'Everything toast',
      ru: 'Тост «из всего»',
    },
    ingredients: {
      uz: ['Non', 'Mavjud mahsulotlar', 'Moy yoki sariyog‘', 'Tuz va murch'],
      en: ['Bread', 'Whatever you have', 'Oil or butter', 'Salt and pepper'],
      ru: ['Хлеб', 'То, что есть', 'Масло', 'Соль и перец'],
    },
    steps: {
      uz: [
        'Nonni quritib yoki qizartirib oling.',
        'Muddati yaqin mahsulotlarni tayyorlab, ustiga joylang.',
        'Ziravorlar sepib, issiq holda torting.',
      ],
      en: [
        'Toast or warm the bread.',
        'Prepare your expiring items and pile them on top.',
        'Season and serve while hot.',
      ],
      ru: [
        'Подсушите или подогрейте хлеб.',
        'Подготовьте продукты и выложите сверху.',
        'Приправьте и подавайте горячим.',
      ],
    },
  },
]
