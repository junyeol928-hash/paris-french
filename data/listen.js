/* 聞き取り: 現地で「言われる」文。音声を聞いて意味を 4 つから選ぶ。
   c[0] が正解（画面では並べ替える）。s: 場面（DATA.listenCats の id）。n: 解説
   値段は店の表示どおり「12,50 €」（フランスは小数点がカンマ）で書く */
window.DATA = window.DATA || {};
window.DATA.listenCats = [
  { id: "prix", ja: "値段・数字" },
  { id: "heure", ja: "時刻" },
  { id: "cafe", ja: "カフェ・パン屋" },
  { id: "resto", ja: "レストラン" },
  { id: "hotel", ja: "ホテル" },
  { id: "metro", ja: "駅・車内放送" },
  { id: "visite", ja: "美術館・観光" },
  { id: "air", ja: "空港" },
  { id: "shop", ja: "買い物・支払い" },
  { id: "base", ja: "ひとこと" },
];
window.DATA.listen = [
  /* ---- 値段・数字 ---- */
  { id: "l001", s: "prix", fr: "Ça fait douze euros cinquante.", c: ["12,50 €", "2,50 €", "20,50 €", "12,15 €"], n: "douze = 12、cinquante = 50。ユーロの後の数字はセント" },
  { id: "l002", s: "prix", fr: "Ça fait quatre euros vingt.", c: ["4,20 €", "4,12 €", "14,20 €", "24 €"], n: "quatre euros vingt = 4 ユーロ 20" },
  { id: "l003", s: "prix", fr: "Ça vous fait soixante-cinq euros.", c: ["65 €", "75 €", "56 €", "25 €"], n: "soixante = 60。空港からのタクシーの定額は、金額が年で変わることがある" },
  { id: "l004", s: "prix", fr: "C'est quatre-vingt-dix euros.", c: ["90 €", "80 €", "70 €", "19 €"], n: "quatre-vingt-dix = 4×20+10 = 90" },
  { id: "l005", s: "prix", fr: "Trois cafés, ça fait sept euros cinquante.", c: ["7,50 €", "3,50 €", "17,50 €", "7,15 €"] },
  { id: "l006", s: "prix", fr: "Soixante-dix euros, s'il vous plaît.", c: ["70 €", "60 €", "17 €", "80 €"], n: "soixante-dix = 60+10 = 70" },
  { id: "l007", s: "prix", fr: "C'est trente-deux euros.", c: ["32 €", "22 €", "42 €", "23 €"] },
  { id: "l008", s: "prix", fr: "Quatorze euros, s'il vous plaît.", c: ["14 €", "40 €", "4 €", "24 €"], n: "quatorze = 14、quarante = 40。似ているので注意" },
  { id: "l009", s: "prix", fr: "Ça fait quarante-huit euros.", c: ["48 €", "38 €", "84 €", "68 €"] },
  { id: "l010", s: "prix", fr: "Quatre-vingt-quinze euros.", c: ["95 €", "85 €", "75 €", "15 €"], n: "quatre-vingt-quinze = 80+15 = 95" },
  { id: "l011", s: "prix", fr: "Seize euros quarante.", c: ["16,40 €", "6,40 €", "16,14 €", "60,40 €"], n: "seize = 16" },
  { id: "l012", s: "prix", fr: "Ça fait cent vingt euros.", c: ["120 €", "100 €", "20 €", "102 €"], n: "cent = 100" },
  { id: "l013", s: "prix", fr: "Deux euros cinquante, s'il vous plaît.", c: ["2,50 €", "2,15 €", "12,50 €", "25 €"] },
  { id: "l014", s: "prix", fr: "Chambre trois cent cinq.", c: ["305 号室", "315 号室", "350 号室", "35 号室"], n: "trois cent cinq = 305" },

  /* ---- 時刻 ---- */
  { id: "l020", s: "heure", fr: "Le petit-déjeuner est servi de sept heures à dix heures.", c: ["朝食は 7 時〜10 時です", "朝食は 7 時〜9 時です", "朝食は 6 時〜10 時です", "朝食は 17 時〜20 時です"] },
  { id: "l021", s: "heure", fr: "Le musée ferme à dix-huit heures.", c: ["美術館は 18 時に閉まります", "美術館は 8 時に閉まります", "美術館は 16 時に閉まります", "美術館は 18 時に開きます"], n: "時刻は 24 時間制で言うことが多い" },
  { id: "l022", s: "heure", fr: "Le prochain train est dans cinq minutes.", c: ["次の電車は 5 分後です", "次の電車は 15 分後です", "次の電車は 5 時です", "電車は 5 分遅れています"] },
  { id: "l023", s: "heure", fr: "Revenez dans une demi-heure.", c: ["30 分後にまた来てください", "1 時間半後にまた来てください", "2 時間後にまた来てください", "15 分後にまた来てください"], n: "demi-heure = 半時間" },
  { id: "l024", s: "heure", fr: "Il est quinze heures.", c: ["15 時です", "5 時です", "14 時です", "50 分です"] },
  { id: "l025", s: "heure", fr: "Le départ est à dix-neuf heures trente.", c: ["出発は 19 時 30 分です", "出発は 9 時 30 分です", "出発は 19 時 13 分です", "到着は 19 時 30 分です"] },
  { id: "l026", s: "heure", fr: "Vous devez libérer la chambre avant onze heures.", c: ["11 時までにチェックアウトしてください", "12 時までにチェックアウトしてください", "11 時からチェックインできます", "10 時までにチェックアウトしてください"] },
  { id: "l027", s: "heure", fr: "On ouvre à neuf heures et demie.", c: ["9 時半に開きます", "9 時に開きます", "9 時半に閉まります", "10 時半に開きます"], n: "et demie = 半" },
  { id: "l028", s: "heure", fr: "Il faut compter vingt minutes à pied.", c: ["歩いて 20 分ほどです", "歩いて 2 分ほどです", "車で 20 分ほどです", "20 時までに行ってください"] },

  /* ---- カフェ・パン屋 ---- */
  { id: "l040", s: "cafe", fr: "Bonjour, qu'est-ce que je vous sers ?", c: ["何になさいますか？", "何名様ですか？", "お会計ですか？", "店内でお召し上がりですか？"] },
  { id: "l041", s: "cafe", fr: "Sur place ou à emporter ?", c: ["店内ですか、お持ち帰りですか？", "カードですか、現金ですか？", "温かいのと冷たいの、どちらにしますか？", "小さいのと大きいの、どちらにしますか？"] },
  { id: "l042", s: "cafe", fr: "Et avec ceci ?", c: ["ほかにご注文は？", "お支払いは？", "サイズは？", "お砂糖は？"], n: "パン屋でほぼ必ず聞かれる。なければ C'est tout, merci" },
  { id: "l043", s: "cafe", fr: "Ce sera tout ?", c: ["以上でよろしいですか？", "これで売り切れです", "全部でいくらです", "お持ち帰りですか？"] },
  { id: "l044", s: "cafe", fr: "Vous payez comment ?", c: ["お支払い方法は？", "いくら払いますか？", "お名前は？", "何名様ですか？"] },
  { id: "l045", s: "cafe", fr: "Vous avez de la monnaie ?", c: ["細かいお金はありますか？", "おつりは要りますか？", "現金で払いますか？", "カードで払いますか？"] },
  { id: "l046", s: "cafe", fr: "Je vous écoute.", c: ["ご注文をどうぞ", "少々お待ちください", "聞こえません", "お呼びしましたか？"], n: "直訳は「聞いています」。注文を促す決まり文句" },
  { id: "l047", s: "cafe", fr: "Il n'y en a plus.", c: ["もう売り切れです", "まだたくさんあります", "もっといかがですか？", "あちらにあります"] },
  { id: "l048", s: "cafe", fr: "Avec du lait ?", c: ["ミルクを入れますか？", "砂糖を入れますか？", "氷を入れますか？", "温かいのにしますか？"] },
  { id: "l049", s: "cafe", fr: "Installez-vous où vous voulez.", c: ["お好きな席へどうぞ", "こちらでお待ちください", "満席です", "テラス席のみです"] },

  /* ---- レストラン ---- */
  { id: "l060", s: "resto", fr: "Vous avez réservé ?", c: ["ご予約はありますか？", "ご注文はお決まりですか？", "何名様ですか？", "お済みですか？"] },
  { id: "l061", s: "resto", fr: "Vous êtes combien ?", c: ["何名様ですか？", "おいくつですか？", "いくらですか？", "どこから来ましたか？"] },
  { id: "l062", s: "resto", fr: "Vous avez choisi ?", c: ["ご注文はお決まりですか？", "お食事はお済みですか？", "ご予約はありますか？", "お飲み物は何にしますか？"] },
  { id: "l063", s: "resto", fr: "Et comme boisson ?", c: ["お飲み物は？", "デザートは？", "前菜は？", "お会計は？"] },
  { id: "l064", s: "resto", fr: "Quelle cuisson pour la viande ?", c: ["お肉の焼き加減は？", "お肉の量は？", "肉と魚どちらに？", "ソースはどうしますか？"], n: "答えは à point（ミディアム）か bien cuit（よく焼く）" },
  { id: "l065", s: "resto", fr: "Ça vous a plu ?", c: ["お口に合いましたか？", "お腹いっぱいですか？", "お会計しますか？", "ほかにご注文は？"] },
  { id: "l066", s: "resto", fr: "Un dessert, un café ?", c: ["デザートかコーヒーはいかがですか？", "デザートは終わりました", "コーヒーのお代わりは？", "お会計はご一緒ですか？"] },
  { id: "l067", s: "resto", fr: "Bon appétit !", c: ["どうぞ召し上がれ", "お待たせしました", "おいしいですか？", "ごちそうさまでした"] },
  { id: "l068", s: "resto", fr: "En terrasse ou à l'intérieur ?", c: ["テラス席と店内、どちらにしますか？", "お持ち帰りですか？", "2 階と 1 階、どちらにしますか？", "お一人ですか？"] },
  { id: "l069", s: "resto", fr: "Je vous apporte l'addition.", c: ["お会計をお持ちします", "メニューをお持ちします", "お水をお持ちします", "お皿をお下げします"] },
  { id: "l070", s: "resto", fr: "Il faut attendre un quart d'heure.", c: ["15 分ほどお待ちください", "30 分ほどお待ちください", "45 分ほどお待ちください", "1 時間ほどお待ちください"], n: "un quart d'heure = 15 分" },
  { id: "l071", s: "resto", fr: "Le plat du jour, c'est un confit de canard.", c: ["本日の料理は鴨のコンフィです", "本日の料理は牛肉の赤ワイン煮です", "今日は鴨料理がありません", "鴨のコンフィは売り切れです"] },
  { id: "l072", s: "resto", fr: "En entrée, nous avons des escargots.", c: ["前菜にエスカルゴがあります", "メインはエスカルゴです", "エスカルゴは売り切れました", "エスカルゴは追加料金がかかります"], n: "entrée = 前菜" },
  { id: "l073", s: "resto", fr: "Le service est compris.", c: ["サービス料は込みです", "サービス料は別です", "これはサービス（無料）です", "もう営業は終わりました"] },

  /* ---- ホテル ---- */
  { id: "l080", s: "hotel", fr: "C'est à quel nom ?", c: ["お名前は？", "何泊ですか？", "何名様ですか？", "お部屋番号は？"] },
  { id: "l081", s: "hotel", fr: "Votre passeport, s'il vous plaît.", c: ["パスポートをお願いします", "鍵をお願いします", "カードをお願いします", "サインをお願いします"] },
  { id: "l082", s: "hotel", fr: "Vous êtes au troisième étage.", c: ["フランス式の 3 階（日本の 4 階）です", "フランス式の 2 階（日本の 3 階）です", "お部屋は 13 号室です", "エレベーターは 3 基です"], n: "エレベーターで押すのは 3。地上階は 0 や RDC と書かれていることが多い" },
  { id: "l083", s: "hotel", fr: "L'ascenseur est au fond, à gauche.", c: ["エレベーターは奥の左です", "エレベーターは手前の右です", "階段は奥の左です", "エレベーターは故障中です"], n: "à gauche = 左、à droite = 右" },
  { id: "l084", s: "hotel", fr: "Le petit-déjeuner n'est pas compris.", c: ["朝食は料金に含まれていません", "朝食は料金に含まれています", "朝食はもう終わりました", "朝食はお部屋で食べられます"] },
  { id: "l085", s: "hotel", fr: "Pouvez-vous signer ici ?", c: ["ここにサインしてもらえますか？", "ここで待ってもらえますか？", "ここに書いてありますか？", "ここで払えますか？"] },
  { id: "l086", s: "hotel", fr: "La taxe de séjour est à régler sur place.", c: ["宿泊税はここで払ってください", "宿泊税は料金に含まれています", "税金はあとで戻ります", "朝食代は別です"], n: "この文は「宿泊税を現地で払って」という意味。予約サイトで払い済みのこともあるので明細を確認" },
  { id: "l087", s: "hotel", fr: "Bon séjour !", c: ["よい滞在を！", "お帰りなさい", "またお越しください", "お気をつけて"] },

  /* ---- 駅・車内放送 ---- */
  { id: "l100", s: "metro", fr: "Prochaine station : Saint-Michel Notre-Dame.", c: ["次の駅はサン＝ミシェル・ノートルダムです", "この電車はサン＝ミシェル行きです", "サン＝ミシェルは通過します", "サン＝ミシェルで乗り換えです"], n: "パリ中心、ノートルダム大聖堂のそばの駅" },
  { id: "l101", s: "metro", fr: "Attention à la fermeture des portes.", c: ["ドアが閉まります、ご注意ください", "このドアは故障しています", "ドアが開きます", "足元にご注意ください"] },
  { id: "l102", s: "metro", fr: "Attention à la marche en descendant du train.", c: ["降りるときは段差にご注意ください", "電車が止まります", "走らないでください", "荷物にご注意ください"] },
  { id: "l103", s: "metro", fr: "Terminus, tout le monde descend.", c: ["終点です。全員お降りください", "次は終点です", "この電車は直通です", "乗り換えてください"] },
  { id: "l104", s: "metro", fr: "Le trafic est interrompu sur la ligne quatre.", c: ["4 号線は運転を見合わせています", "4 号線は遅れています", "4 号線は混雑しています", "4 番ホームは閉鎖中です"] },
  { id: "l105", s: "metro", fr: "Attention aux pickpockets.", c: ["スリにご注意ください", "置き去りの荷物にご注意ください", "切符を落とさないでください", "押さないでください"], n: "車内でよく耳にするスリへの注意" },
  { id: "l106", s: "metro", fr: "Direction Versailles Château Rive Gauche.", c: ["ヴェルサイユ・シャトー・リヴ・ゴーシュ方面です", "ヴェルサイユから来た電車です", "ヴェルサイユは通過します", "ヴェルサイユまで 30 分です"] },
  { id: "l107", s: "metro", fr: "Le train a un retard de dix minutes.", c: ["電車は 10 分遅れています", "電車は 10 分後に来ます", "電車は 10 時に出ます", "電車は 10 両です"] },
  { id: "l108", s: "metro", fr: "Votre titre de transport, s'il vous plaît.", c: ["乗車券を見せてください", "行き先はどこですか？", "荷物を見せてください", "ここで降りてください"], n: "検札。切符は駅を出るまで捨てない" },

  /* ---- 美術館・観光 ---- */
  { id: "l120", s: "visite", fr: "Le musée ferme dans quinze minutes.", c: ["美術館はあと 15 分で閉まります", "美術館は 15 分後に開きます", "美術館はあと 50 分で閉まります", "美術館は 15 時に閉まります"] },
  { id: "l121", s: "visite", fr: "Les photos avec flash sont interdites.", c: ["フラッシュ撮影は禁止です", "写真撮影はすべて禁止です", "フラッシュを使ってもかまいません", "撮影は無料です"] },
  { id: "l122", s: "visite", fr: "Les sacs à dos doivent être déposés au vestiaire.", c: ["リュックはクロークに預けてください", "リュックは前に抱えてください", "リュックは持ち込めます", "バッグの中を見せてください"] },
  { id: "l123", s: "visite", fr: "Ouvrez votre sac, s'il vous plaît.", c: ["バッグを開けてください", "バッグを預けてください", "バッグを閉めてください", "バッグはここに置いてください"], n: "入口の手荷物検査" },
  { id: "l124", s: "visite", fr: "Vous avez votre billet ?", c: ["チケットはお持ちですか？", "チケットは売り切れです", "チケットは何枚ですか？", "チケットはあちらで買えます"] },
  { id: "l125", s: "visite", fr: "C'est complet pour aujourd'hui.", c: ["今日はもう満員です", "今日は無料です", "今日は休館日です", "今日はまだ空いています"] },
  { id: "l126", s: "visite", fr: "La sortie est par ici.", c: ["出口はこちらです", "入口はこちらです", "トイレはこちらです", "列はこちらです"] },
  { id: "l127", s: "visite", fr: "Ne touchez pas, s'il vous plaît.", c: ["触らないでください", "押さないでください", "撮らないでください", "入らないでください"] },

  /* ---- 空港 ---- */
  { id: "l140", s: "air", fr: "Quel est le but de votre voyage ?", c: ["旅行の目的は？", "行き先は？", "滞在日数は？", "ご職業は？"] },
  { id: "l141", s: "air", fr: "Combien de temps restez-vous ?", c: ["どのくらい滞在しますか？", "何時に着きましたか？", "何人ですか？", "どこに泊まりますか？"] },
  { id: "l142", s: "air", fr: "Où logez-vous ?", c: ["どこに泊まりますか？", "どこから来ましたか？", "どこへ行きますか？", "どこで働いていますか？"] },
  { id: "l143", s: "air", fr: "Vous avez quelque chose à déclarer ?", c: ["申告するものはありますか？", "荷物はいくつですか？", "お土産はありますか？", "液体はありますか？"] },
  { id: "l144", s: "air", fr: "L'embarquement commence à dix-huit heures quarante.", c: ["搭乗は 18 時 40 分に始まります", "搭乗は 8 時 40 分に始まります", "出発は 18 時 40 分です", "搭乗口は 18 番です"] },
  { id: "l145", s: "air", fr: "Porte numéro trente-deux.", c: ["32 番ゲートです", "22 番ゲートです", "42 番ゲートです", "23 番ゲートです"] },
  { id: "l146", s: "air", fr: "Le vol est retardé.", c: ["便は遅れています", "便は欠航です", "便は定刻どおりです", "便は満席です"] },
  { id: "l147", s: "air", fr: "Sortez les liquides, s'il vous plaît.", c: ["液体を出してください", "靴を脱いでください", "パソコンを出してください", "ベルトを外してください"] },

  /* ---- 買い物・支払い ---- */
  { id: "l160", s: "shop", fr: "Je peux vous aider ?", c: ["何かお探しですか？", "お支払いですか？", "試着しますか？", "もう閉店です"], n: "見るだけなら Je regarde seulement, merci" },
  { id: "l161", s: "shop", fr: "On ferme dans cinq minutes.", c: ["あと 5 分で閉店です", "5 時に閉店です", "5 分後に開店します", "閉店まで 15 分です"] },
  { id: "l162", s: "shop", fr: "C'est pour offrir ?", c: ["プレゼント用ですか？", "袋はいりますか？", "レシートはいりますか？", "カードはありますか？"] },
  { id: "l163", s: "shop", fr: "Insérez votre carte.", c: ["カードを差し込んでください", "カードをかざしてください", "暗証番号を入力してください", "カードは使えません"] },
  { id: "l164", s: "shop", fr: "Tapez votre code.", c: ["暗証番号を入力してください", "サインしてください", "カードを抜いてください", "番号札をお取りください"] },
  { id: "l165", s: "shop", fr: "Paiement accepté.", c: ["お支払いが完了しました", "お支払いができませんでした", "カードを抜いてください", "もう一度どうぞ"], n: "カード端末の画面にもこの文字が出る" },
  { id: "l166", s: "shop", fr: "Retirez votre carte.", c: ["カードを抜いてください", "カードを入れてください", "カードをかざしてください", "カードは使えません"] },
  { id: "l167", s: "shop", fr: "Vous voulez le ticket ?", c: ["レシートはいりますか？", "チケットは何枚ですか？", "切符を見せてください", "袋はいりますか？"], n: "店の ticket はレシートのこと" },

  /* ---- ひとこと ---- */
  { id: "l180", s: "base", fr: "Enchanté.", c: ["はじめまして", "どうぞ", "ようこそ", "お元気で"] },
  { id: "l181", s: "base", fr: "Je vous en prie.", c: ["どういたしまして", "申し訳ありません", "おめでとうございます", "ご遠慮ください"], n: "Merci と言われたときの返事" },
  { id: "l182", s: "base", fr: "Pas de problème.", c: ["大丈夫ですよ", "困りました", "わかりません", "間違いです"] },
  { id: "l183", s: "base", fr: "Vous venez d'où ?", c: ["どちらから来ましたか？", "どこへ行きますか？", "どこにいますか？", "どなたですか？"] },
  { id: "l184", s: "base", fr: "Un instant, s'il vous plaît.", c: ["少々お待ちください", "すぐ戻ります", "もう一度どうぞ", "もう閉まります"] },
  { id: "l185", s: "base", fr: "Désolé, je ne sais pas.", c: ["すみません、わかりません", "すみません、急いでいます", "すみません、通ります", "すみません、話せません"] },
  { id: "l186", s: "base", fr: "C'est tout droit, puis à droite.", c: ["まっすぐ行って、右です", "まっすぐ行って、左です", "右に曲がって、まっすぐです", "すぐそこの右です"], n: "tout droit = まっすぐ、à droite = 右" },
];
