/* 会話ロールプレイ。相手（s）のせりふは音声で流れ、自分（me）の番は opts から 1 つ選んで声に出す。
   どちらを選んでも次の相手のせりふが自然につながるように書く（分岐はしない）。
   id は変えない（記録のキー）。scene は data/phrases.js の場面 id */
window.DATA = window.DATA || {};
window.DATA.dialogs = [
  { id: "g01", scene: "cafe", fr: "Au café", ja: "カフェで注文する", min: 2,
    lines: [
      { who: "s", fr: "Bonjour ! Qu'est-ce que je vous sers ?", kana: "ボンジュール ケ ス ク ジュ ヴ セール", ja: "こんにちは！何になさいますか？" },
      { who: "me", opts: [
        { fr: "Bonjour ! Un café crème, s'il vous plaît.", kana: "ボンジュール アン カフェ クレム スィル ヴ プレ", ja: "こんにちは！ミルク入りのコーヒーをください" },
        { fr: "Bonjour ! Un chocolat chaud, s'il vous plaît.", kana: "ボンジュール アン ショコラ ショ スィル ヴ プレ", ja: "こんにちは！ホットチョコレートをください" } ] },
      { who: "s", fr: "Sur place ou à emporter ?", kana: "スュール プラス ウ ア アンポルテ", ja: "店内ですか、お持ち帰りですか？" },
      { who: "me", opts: [
        { fr: "Sur place, merci.", kana: "スュール プラス メルスィ", ja: "店内で" },
        { fr: "À emporter, merci.", kana: "ア アンポルテ メルスィ", ja: "持ち帰りで" } ] },
      { who: "s", fr: "Très bien. Ça fait quatre euros cinquante.", kana: "トレ ビャン サ フェ キャトル ウーロ サンカント", ja: "かしこまりました。4 ユーロ 50 です。" },
      { who: "me", opts: [
        { fr: "Je peux payer par carte ?", kana: "ジュ プ ペイエ パール カルト", ja: "カードで払えますか？" },
        { fr: "Voilà.", kana: "ヴォワラ", ja: "はい、どうぞ（お金を渡しながら）" } ] },
      { who: "s", fr: "Merci beaucoup. Bonne journée !", kana: "メルスィ ボク ボヌ ジュルネ", ja: "ありがとうございます。よい 1 日を！" },
      { who: "me", opts: [
        { fr: "Merci, vous aussi !", kana: "メルスィ ヴ ゾスィ", ja: "ありがとう、あなたも！" },
        { fr: "Merci, au revoir !", kana: "メルスィ オ ルヴォワール", ja: "ありがとう、さようなら！" } ] },
    ] },
  { id: "g02", scene: "cafe", fr: "À la boulangerie", ja: "パン屋で買う", min: 2,
    lines: [
      { who: "s", fr: "Bonjour, madame. Je vous écoute.", kana: "ボンジュール マダム ジュ ヴ ゼクート", ja: "こんにちは。ご注文をどうぞ。", n: "男性なら monsieur（ムスィュー）と呼ばれる" },
      { who: "me", opts: [
        { fr: "Bonjour ! Deux croissants, s'il vous plaît.", kana: "ボンジュール ドゥ クロワッサン スィル ヴ プレ", ja: "こんにちは！クロワッサンを 2 つください" },
        { fr: "Bonjour ! Une baguette, s'il vous plaît.", kana: "ボンジュール ユヌ バゲット スィル ヴ プレ", ja: "こんにちは！バゲットを 1 本ください" } ] },
      { who: "s", fr: "Et avec ceci ?", kana: "エ アヴェック ススィ", ja: "ほかにご注文は？" },
      { who: "me", opts: [
        { fr: "C'est tout, merci.", kana: "セ トゥ メルスィ", ja: "以上です" },
        { fr: "Et un pain au chocolat, s'il vous plaît.", kana: "エ アン パン オ ショコラ スィル ヴ プレ", ja: "あと、パン・オ・ショコラを 1 つ" } ] },
      { who: "s", fr: "D'accord. Ça vous fait trois euros vingt.", kana: "ダコール サ ヴ フェ トロワ ズーロ ヴァン", ja: "わかりました。3 ユーロ 20 です。" },
      { who: "me", opts: [
        { fr: "Voilà. Merci !", kana: "ヴォワラ メルスィ", ja: "はい、どうぞ。ありがとう！" },
        { fr: "Par carte, s'il vous plaît.", kana: "パール カルト スィル ヴ プレ", ja: "カードでお願いします" } ] },
      { who: "s", fr: "Merci. Bonne journée !", kana: "メルスィ ボヌ ジュルネ", ja: "ありがとうございます。よい 1 日を！" },
      { who: "me", opts: [
        { fr: "Bonne journée, au revoir !", kana: "ボヌ ジュルネ オ ルヴォワール", ja: "よい 1 日を、さようなら！" },
        { fr: "Merci, vous aussi !", kana: "メルスィ ヴ ゾスィ", ja: "ありがとう、あなたも！" } ] },
    ] },
  { id: "g03", scene: "resto", fr: "Au restaurant", ja: "レストランで食事", min: 3,
    lines: [
      { who: "s", fr: "Bonsoir ! Vous êtes combien ?", kana: "ボンソワール ヴ ゼット コンビャン", ja: "こんばんは！何名様ですか？" },
      { who: "me", opts: [
        { fr: "Bonsoir ! Nous sommes trois.", kana: "ボンソワール ヌ ソム トロワ", ja: "こんばんは！3 人です" },
        { fr: "Bonsoir ! Nous avons réservé une table pour trois.", kana: "ボンソワール ヌ ザヴォン レゼルヴェ ユヌ ターブル プール トロワ", ja: "こんばんは！3 人で予約しています" } ] },
      { who: "s", fr: "Très bien, suivez-moi. Voici la carte.", kana: "トレ ビャン スュイヴェ モワ ヴォワスィ ラ カルト", ja: "かしこまりました、こちらへどうぞ。メニューです。" },
      { who: "s", fr: "Vous avez choisi ?", kana: "ヴ ザヴェ ショワズィ", ja: "ご注文はお決まりですか？" },
      { who: "me", opts: [
        { fr: "Le menu du jour, s'il vous plaît.", kana: "ル ムニュ デュ ジュール スィル ヴ プレ", ja: "日替わりのセットをお願いします" },
        { fr: "Qu'est-ce que vous recommandez ?", kana: "ケ ス ク ヴ ルコマンデ", ja: "おすすめは何ですか？" } ] },
      { who: "s", fr: "Je vous conseille le confit de canard. Et comme boisson ?", kana: "ジュ ヴ コンセイユ ル コンフィ ドゥ カナール エ コム ボワソン", ja: "鴨のコンフィがおすすめです。お飲み物は？" },
      { who: "me", opts: [
        { fr: "Une carafe d'eau, s'il vous plaît.", kana: "ユヌ カラフ ドー スィル ヴ プレ", ja: "水差しのお水をください" },
        { fr: "Un verre de vin rouge, s'il vous plaît.", kana: "アン ヴェール ドゥ ヴァン ルージュ スィル ヴ プレ", ja: "赤ワインを 1 杯ください" } ] },
      { who: "s", fr: "Parfait. Ça vous a plu ?", kana: "パルフェ サ ヴ ザ プリュ", ja: "かしこまりました。……お口に合いましたか？", n: "食事のあとで" },
      { who: "me", opts: [
        { fr: "C'était délicieux ! L'addition, s'il vous plaît.", kana: "セテ デリスィュー ラディスィオン スィル ヴ プレ", ja: "おいしかったです！お会計をお願いします" },
        { fr: "Oui, merci beaucoup. L'addition, s'il vous plaît.", kana: "ウィ メルスィ ボク ラディスィオン スィル ヴ プレ", ja: "はい、ありがとう。お会計をお願いします" } ] },
      { who: "s", fr: "Je vous apporte l'addition. Merci et bonne soirée !", kana: "ジュ ヴ ザポルト ラディスィオン メルスィ エ ボヌ ソワレ", ja: "お会計をお持ちします。ありがとうございました、よい夜を！" },
    ] },
  { id: "g04", scene: "hotel", fr: "À la réception", ja: "ホテルにチェックイン", min: 2,
    lines: [
      { who: "s", fr: "Bonsoir, bienvenue ! Vous avez une réservation ?", kana: "ボンソワール ビャンヴニュ ヴ ザヴェ ユヌ レゼルヴァスィオン", ja: "こんばんは、ようこそ！ご予約はありますか？" },
      { who: "me", opts: [
        { fr: "Bonsoir ! Oui, j'ai réservé une chambre pour trois personnes.", kana: "ボンソワール ウィ ジェ レゼルヴェ ユヌ シャンブル プール トロワ ペルソヌ", ja: "こんばんは！はい、3 人部屋を予約しています" },
        { fr: "Bonsoir ! Oui. Voici la réservation.", kana: "ボンソワール ウィ ヴォワスィ ラ レゼルヴァスィオン", ja: "こんばんは！はい。予約はこれです（画面を見せる）" } ] },
      { who: "s", fr: "Parfait. Vos passeports, s'il vous plaît.", kana: "パルフェ ヴォ パスポール スィル ヴ プレ", ja: "ありがとうございます。パスポートをお願いします。" },
      { who: "me", opts: [
        { fr: "Voici nos passeports.", kana: "ヴォワスィ ノ パスポール", ja: "パスポートです" },
        { fr: "Les voici.", kana: "レ ヴォワスィ", ja: "はい、どうぞ" } ] },
      { who: "s", fr: "Merci. Vous êtes au troisième étage. Le petit-déjeuner est servi de sept heures à dix heures.", kana: "メルスィ ヴ ゼット オ トロワズィエム エタージュ ル プティ デジュネ エ セルヴィ ドゥ セットゥール ア ディズール", ja: "ありがとうございます。お部屋は 3 階（日本の 4 階）です。朝食は 7 時から 10 時です。" },
      { who: "me", opts: [
        { fr: "Où est l'ascenseur ?", kana: "ウ エ ラサンスール", ja: "エレベーターはどこですか？" },
        { fr: "Quel est le code du wifi ?", kana: "ケ レ ル コード デュ ウィフィ", ja: "Wi-Fi のパスワードは？" } ] },
      { who: "s", fr: "C'est indiqué ici, sur la carte. Bon séjour !", kana: "セ タンディケ イスィ スュール ラ カルト ボン セジュール", ja: "このカードに書いてあります。よい滞在を！" },
      { who: "me", opts: [
        { fr: "Merci beaucoup !", kana: "メルスィ ボク", ja: "ありがとうございます！" },
        { fr: "Merci, bonne soirée !", kana: "メルスィ ボヌ ソワレ", ja: "ありがとう、よい夜を！" } ] },
    ] },
  { id: "g05", scene: "taxi", fr: "En taxi", ja: "空港からタクシー", min: 2,
    lines: [
      { who: "s", fr: "Bonsoir ! Vous allez où ?", kana: "ボンソワール ヴ ザレ ウ", ja: "こんばんは！どちらまで？" },
      { who: "me", opts: [
        { fr: "Bonsoir ! À cette adresse, s'il vous plaît.", kana: "ボンソワール ア セッタドレス スィル ヴ プレ", ja: "こんばんは！この住所までお願いします（住所を見せる）" },
        { fr: "Bonsoir ! À l'hôtel, à cette adresse, s'il vous plaît.", kana: "ボンソワール ア ロテル ア セッタドレス スィル ヴ プレ", ja: "こんばんは！この住所のホテルまでお願いします" } ] },
      { who: "s", fr: "D'accord. Vous avez des bagages ?", kana: "ダコール ヴ ザヴェ デ バガージュ", ja: "わかりました。お荷物はありますか？" },
      { who: "me", opts: [
        { fr: "Oui, trois valises. Pouvez-vous ouvrir le coffre ?", kana: "ウィ トロワ ヴァリーズ プヴェ ヴ ウヴリール ル コッフル", ja: "はい、スーツケースが 3 つ。トランクを開けてもらえますか？" },
        { fr: "Oui. Nous sommes trois.", kana: "ウィ ヌ ソム トロワ", ja: "はい。3 人です" } ] },
      { who: "s", fr: "Pas de problème. On y va !", kana: "パ ドゥ プロブレム オン ニ ヴァ", ja: "大丈夫ですよ。では出発します！" },
      { who: "me", opts: [
        { fr: "C'est bien le tarif forfaitaire ?", kana: "セ ビャン ル タリフ フォルフェテール", ja: "定額料金で間違いないですか？" },
        { fr: "Vous acceptez la carte ?", kana: "ヴ ザクセプテ ラ カルト", ja: "カードは使えますか？" } ] },
      { who: "s", fr: "Oui, bien sûr.", kana: "ウィ ビャン スュール", ja: "はい、もちろん。" },
      { who: "s", fr: "Voilà, nous sommes arrivés.", kana: "ヴォワラ ヌ ソム ザリヴェ", ja: "はい、着きましたよ。", n: "到着" },
      { who: "me", opts: [
        { fr: "Merci beaucoup ! Un reçu, s'il vous plaît.", kana: "メルスィ ボク アン ルスュ スィル ヴ プレ", ja: "ありがとうございます！領収書をお願いします" },
        { fr: "Merci, bonne soirée !", kana: "メルスィ ボヌ ソワレ", ja: "ありがとう、よい夜を！" } ] },
    ] },
  { id: "g06", scene: "metro", fr: "Au guichet du métro", ja: "メトロの窓口で", min: 2,
    lines: [
      { who: "s", fr: "Bonjour, je peux vous aider ?", kana: "ボンジュール ジュ プ ヴ ゼデ", ja: "こんにちは、どうしましたか？" },
      { who: "me", opts: [
        { fr: "Bonjour ! Trois passes Navigo Easy, s'il vous plaît.", kana: "ボンジュール トロワ パス ナヴィゴ イズィ スィル ヴ プレ", ja: "こんにちは！Navigo Easy を 3 枚ください" },
        { fr: "Bonjour ! Nous voulons aller à Versailles.", kana: "ボンジュール ヌ ヴロン アレ ア ヴェルサイユ", ja: "こんにちは！ヴェルサイユに行きたいです" } ] },
      { who: "s", fr: "Pour Versailles, prenez le RER C, direction Versailles Château Rive Gauche.", kana: "プール ヴェルサイユ プルネ ル エール ウ エール セ ディレクスィオン ヴェルサイユ シャトー リヴ ゴーシュ", ja: "ヴェルサイユなら RER C 線、ヴェルサイユ・シャトー・リヴ・ゴーシュ方面に乗ってください。" },
      { who: "me", opts: [
        { fr: "C'est quel quai ?", kana: "セ ケル ケ", ja: "何番ホームですか？" },
        { fr: "Pouvez-vous me montrer sur le plan ?", kana: "プヴェ ヴ ム モントレ スュール ル プラン", ja: "地図で教えてもらえますか？" } ] },
      { who: "s", fr: "Voilà, c'est ici. Le prochain train est dans cinq minutes.", kana: "ヴォワラ セ ティスィ ル プロシャン トラン エ ダン サン ミニュット", ja: "ここです。次の電車は 5 分後です。" },
      { who: "me", opts: [
        { fr: "Merci beaucoup !", kana: "メルスィ ボク", ja: "ありがとうございます！" },
        { fr: "D'accord, merci. Bonne journée !", kana: "ダコール メルスィ ボヌ ジュルネ", ja: "わかりました、ありがとう。よい 1 日を！" } ] },
    ] },
  { id: "g07", scene: "visite", fr: "Au musée", ja: "美術館の入口で", min: 2,
    lines: [
      { who: "s", fr: "Bonjour ! Vous avez votre billet ?", kana: "ボンジュール ヴ ザヴェ ヴォトル ビエ", ja: "こんにちは！チケットはお持ちですか？" },
      { who: "me", opts: [
        { fr: "Oui, j'ai un billet pour neuf heures.", kana: "ウィ ジェ アン ビエ プール ヌヴール", ja: "はい、9 時の券を持っています" },
        { fr: "Oui, voici nos billets.", kana: "ウィ ヴォワスィ ノ ビエ", ja: "はい、チケットです" } ] },
      { who: "s", fr: "Merci. Ouvrez votre sac, s'il vous plaît.", kana: "メルスィ ウヴレ ヴォトル サック スィル ヴ プレ", ja: "ありがとうございます。バッグを開けてください。" },
      { who: "me", opts: [
        { fr: "Voilà.", kana: "ヴォワラ", ja: "どうぞ" },
        { fr: "D'accord. Où est le vestiaire ?", kana: "ダコール ウ エ ル ヴェスティエール", ja: "はい。クロークはどこですか？" } ] },
      { who: "s", fr: "C'est bon. Le vestiaire est à gauche, après l'entrée.", kana: "セ ボン ル ヴェスティエール エ タ ゴーシュ アプレ ラントレ", ja: "大丈夫です。クロークは入ってすぐ左です。" },
      { who: "me", opts: [
        { fr: "Où est la Joconde ?", kana: "ウ エ ラ ジョコンド", ja: "モナ・リザはどこですか？" },
        { fr: "Un plan, s'il vous plaît.", kana: "アン プラン スィル ヴ プレ", ja: "館内図をください" } ] },
      { who: "s", fr: "Suivez les panneaux, c'est au premier étage. Bonne visite !", kana: "スュイヴェ レ パノー セ ト プルミエ レタージュ ボヌ ヴィズィット", ja: "案内の表示に沿って、2 階（フランス式 1 階）です。楽しんでください！" },
    ] },
  { id: "g08", scene: "urgence", fr: "À la pharmacie", ja: "薬局で相談する", min: 2,
    lines: [
      { who: "s", fr: "Bonjour, qu'est-ce qui ne va pas ?", kana: "ボンジュール ケ ス キ ヌ ヴァ パ", ja: "こんにちは、どうしましたか？" },
      { who: "me", opts: [
        { fr: "Bonjour. J'ai mal à la tête.", kana: "ボンジュール ジェ マル ア ラ テット", ja: "こんにちは。頭が痛いです" },
        { fr: "Bonjour. Ma mère ne se sent pas bien.", kana: "ボンジュール マ メール ヌ ス サン パ ビャン", ja: "こんにちは。母の具合が悪いです" } ] },
      { who: "s", fr: "Depuis quand ? Vous avez de la fièvre ?", kana: "ドゥピュイ カン ヴ ザヴェ ドゥ ラ フィエーヴル", ja: "いつからですか？熱はありますか？" },
      { who: "me", opts: [
        { fr: "Depuis ce matin. Je ne sais pas.", kana: "ドゥピュイ ス マタン ジュ ヌ セ パ", ja: "今朝からです。熱はわかりません" },
        { fr: "Depuis hier. Non, pas de fièvre.", kana: "ドゥピュイ イエール ノン パ ドゥ フィエーヴル", ja: "昨日からです。熱はありません" } ] },
      { who: "s", fr: "Je vous donne ceci. Deux comprimés, trois fois par jour.", kana: "ジュ ヴ ドヌ ススィ ドゥ コンプリメ トロワ フォワ パール ジュール", ja: "これをお渡しします。1 回 2 錠、1 日 3 回です。" },
      { who: "me", opts: [
        { fr: "Pouvez-vous l'écrire, s'il vous plaît ?", kana: "プヴェ ヴ レクリール スィル ヴ プレ", ja: "書いてもらえますか？" },
        { fr: "D'accord, merci beaucoup.", kana: "ダコール メルスィ ボク", ja: "わかりました、ありがとうございます" } ] },
      { who: "s", fr: "Bien sûr. Si ça ne va pas mieux, allez voir un médecin.", kana: "ビャン スュール スィ サ ヌ ヴァ パ ミュー アレ ヴォワール アン メドサン", ja: "もちろんです。よくならなければ、お医者さんにかかってください。" },
    ] },
];
