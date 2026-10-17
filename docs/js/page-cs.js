/*
 * page-cs.js: Czech text of the homepage (index.html). Each key matches a
 * data-i18n attribute; app.js swaps the English HTML for these when the
 * interface language is Czech. Keep the markup (<b>, <strong>, <span>) in
 * step with the English original.
 */

const PAGE_CS = {
  "meta.title": "EIA: Hodnocení environmentálního dopadu startupů",
  "meta.description": "Pochopte svůj dopad. Posilte svá tvrzení. Zjistěte, co dál. Řízené environmentální hodnocení pro startupy v raných fázích: zmapujte, jak vaše řešení vytváří environmentální hodnotu, zjistěte, co dokážete doložit, a sestavte praktický plán, jak důkazy zlepšit.",
  "noscript": "Tento nástroj potřebuje k běhu zapnutý JavaScript.",

  "top.steps": "☰ Kroky",
  "top.navLabel": "Kroky hodnocení",

  "hero.lsub": "Hodnocení environmentálního<br>dopadu startupů",
  "hero.h1": "Pochopte svůj dopad. Posilte svá tvrzení. Zjistěte, co dál.",
  "hero.tagline": "Řízené environmentální hodnocení pro startupy v raných fázích. Zmapujte, jak vaše řešení vytváří environmentální hodnotu, zjistěte, co dokážete doložit, a sestavte praktický plán, jak důkazy zlepšit.",
  "hero.meta": "<span>Zhruba 45–60 minut</span><span>Bez konzultanta</span><span>Na konci akční plán a zpráva</span>",
  "btn.resume": "Mám uložený soubor a chci pokračovat",
  "btn.demo": "Prohlédnout hotovou ukázku",
  "hero.example": "Ukázkou je FieldSense, smyšlený agritech startup s kompletním hodnocením. Můžete si projít všechny kroky i zprávu, aniž byste cokoli vyplňovali.",

  "why.h2": "Proč tento nástroj vznikl",
  "why.lead": "Pokud váš startup jakkoli tvrdí, že pomáhá životnímu prostředí, nejspíš jste se už sami ptali, kolik z toho dokážete opravdu doložit. Dříve či později se zeptá i někdo jiný: akcelerátor, mentor, firemní zákazník, hodnotitel grantu, někdy investor. <em>„Můžete nám ukázat svůj dopad?“</em> A vaše možnosti vypadají takto:",
  "why.o1": "<b>Zadat úplné LCA nebo audit podle GHG Protocol.</b>Důkladné a důvěryhodné, ale ve vaší fázi obvykle příliš pomalé a drahé, zvlášť když se produkt každých pár měsíců mění.",
  "why.o2": "<b>Dát dohromady nějaká čísla sami.</b>Rychlé, ale nakonec vykazujete data, která zrovna máte, ne ta, na kterých záleží. Právě tak se dobře míněné startupy nechtěně dopustí greenwashingu.",
  "why.o3": "<b>Neříkat nic konkrétního.</b>Bezpečné, ale i opravdu dobrý projekt pak vypadá, jako by neměl co ukázat.",
  "why.p1": "Tento nástroj vznikl právě pro tuto mezeru. Jde o <strong>orientační hodnocení</strong>: nenahradí úplné LCA a ani to nepředstírá. Dá vám strukturovaný přehled o tom, co tvrdíte, proč tomu věříte a jak moc si tím opravdu jste jistí.",
  "why.p2": "Rámec, ze kterého vychází, pochází z akademického výzkumu hodnocení environmentálního dopadu v začínajících firmách. Nástroj z něj dělá něco, co si můžete sednout a vyplnit.",

  "who.h2": "Pro koho je určen",
  "who.p": "Především je to pracovní cvičení pro zakladatele: když logiku dopadu dáte na papír, najdete v ní mezery. Stejná struktura se hodí i lidem, kteří startupy podporují a hodnotí.",
  "who.a1": "<b>Zakladatelé startupů</b><span>Pochopte svůj dopad, předpoklady, na kterých stojí, a kde ještě chybějí důkazy.</span>",
  "who.a2": "<b>Akcelerátory a inkubátory</b><span>Strukturované hodnocení, které můžete projít s celým ročníkem, a společný základ pro mentoring zakladatelů.</span>",
  "who.a3": "<b>Investoři zaměření na dopad</b><span>Posuzujte environmentální tvrzení spolu s důkazy a předpoklady, na kterých stojí.</span>",
  "who.a4": "<b>Běžní investoři</b><span>Větší transparentnost tam, kde je environmentální dopad pro případ podstatný.</span>",

  "get.h2": "Co na konci získáte",
  "get.p1": "<strong>Akční plán seřazený podle priority</strong>, který vám řekne, co dál ověřit nebo změřit a proč na tom ve vaší fázi záleží. A <strong>zprávu ve Wordu</strong>, se kterou můžete pracovat v týmu, sdílet ji s akcelerátorem nebo mentory a tam, kde jim na environmentálním dopadu záleží, i se zákazníky nebo investory. Obsahuje klasifikaci dopadu, cestu dopadu, krátkou a cílenou sadu indikátorů, u každého tvrzení označení, nakolik si jím jste jistí, automatickou kontrolu integrity, která najde slabá místa dřív než někdo jiný, přehled, kde váš dopad závisí na obchodních předpokladech, a dohledatelná doporučení s otázkami ke zvážení.",
  "get.p2": "K tomu <strong>uložený soubor</strong>, takže se můžete vrátit a hodnocení aktualizovat, jak firma roste, místo abyste začínali od nuly. Postup se během práce navíc automaticky ukládá v tomto prohlížeči.",

  "before.h2": "Než začnete",
  "before.p": "Nepotřebujete environmentálního konzultanta ani dokonalá data. Vyhraďte si zhruba hodinu, vezměte provozní data, která už máte, a buďte upřímní v tom, co nevíte. To poslední je nejdůležitější: zpráva, která přizná nejistotu, je mnohem důvěryhodnější než zpráva, která ji skrývá.",

  "steps.h2": "Pět kroků",
  "steps.1.h": "Profil a klasifikace startupu",
  "steps.1.p": "Vyplňte údaje o startupu a o tom, kdo je váš zákazník (firmy, spotřebitelé, veřejný sektor nebo kombinace a proč by váš produkt koupili), a pak odpovězte na dvě srozumitelné otázky o tom, jak váš environmentální přínos skutečně vzniká.",
  "steps.1.why": "Tyto dvě odpovědi určují, jak se má váš startup vůbec hodnotit. Firmu, která přímo zachytává uhlík, je třeba měřit úplně jinak než software, který zákazníkům pomáhá plýtvat méně palivem. Většina nástrojů používá pro všechny stejný kontrolní seznam; tento se větví.",
  "steps.2.h": "Zmapujte cestu dopadu",
  "steps.2.p": "Nástroj načte šablonu pro váš typ a provede vás jednotlivými kroky: co se v nich děje, jaký předpoklad je propojuje s dalším krokem a jak silné máte důkazy.",
  "steps.2.why": "Tady je jádro celé věci. Tvrzení o dopadu se rozpadají ve spojích, ne uprostřed. Agritech firma může mít dokonalá data ze senzorů, a přesto se mýlit, protože skutečnou otázkou je, zda farmáři změní, co dělají. Každý článek, který ohodnotíte jako slabý, se automaticky označí.",
  "steps.3.h": "Vyberte indikátory",
  "steps.3.p": "Projděte banku indikátorů v šesti kategoriích a každý ohodnoťte podle relevance a proveditelnosti.",
  "steps.3.why": "Instinkt velí měřit všechno, co se změřit dá, a ten instinkt je obráceně. Míra recyklace v kanceláři se snadno vykazuje, ale nikomu neřekne nic o tom, zda váš produkt pomáhá planetě. Nízká relevance se vyřazuje bez ohledu na to, jak snadné je ji měřit. To pravidlo je záměrné.",
  "steps.4.h": "Porovnejte tvrzení s důkazy",
  "steps.4.p": "Napište každé tvrzení tak, jak byste ho řekli nahlas, označte, odkud jeho číslo pochází (měřené, modelované, nebo projektované) a nakolik se důkazům dá věřit, a propojte ho s výchozím stavem, zdroji a předpoklady.",
  "steps.4.why": "Všechny tři úrovně podloženosti jsou u začínající firmy legitimní. Důvěryhodnost ničí jejich zaměňování. Když je označíte zvlášť, vaše silná tvrzení zesílí: když čtenář vidí, že jste byli pečliví u měkkých čísel, věří i těm tvrdým.",
  "steps.5.h": "Revize, zpráva a export",
  "steps.5.p": "Podívejte se, kde váš environmentální dopad závisí na obchodních předpokladech, projděte doporučení seřazená podle priority pro vaši fázi vývoje, přečtěte si automatické kontroly integrity, nastavte milník, kdy se k hodnocení vrátíte, a stáhněte zprávu.",
  "steps.5.why": "Kontroly integrity jsou nástroj, který vaši práci zkontroluje dřív, než to udělá kdokoli jiný: „parádní“ metriky, příliš velká klíčová sada, tvrzení, která jsou všechna jen projekce, odhady bez uvedených předpokladů.",

  "conf.h2": "Jak se označuje podloženost",
  "conf.p1": "Každé vaše tvrzení dostane jedno ze tří označení. Všechna tři jsou u začínající firmy naprosto legitimní:",
  "conf.l1": "<b>Měřené</b>: máte za tím vlastní provozní data",
  "conf.l2": "<b>Modelované</b>: vychází z oborových průměrů, údajů dodavatelů nebo zjednodušeného výpočtu",
  "conf.l3": "<b>Projektované</b>: stojí na předpokladech o budoucím přijetí nebo rozsahu",
  "conf.p2": "Nikdo nečeká, že startup v seed fázi bude mít auditovaná čísla ke všemu. Důvěryhodnost ničí, když se projekce vydává za měření.",

  "diff.h2": "Čím se nástroj liší",
  "diff.1": "<b>Přizpůsobí se vaší firmě</b>Čtyři typy startupů, tři struktury cesty dopadu, doporučení, která se mění s fází vývoje. Žádný univerzální formulář.",
  "diff.2": "<b>Je přiměřený</b>Tři až pět dobře zvolených indikátorů, ne korporátní kontrolní seznam. Ve fázi nápadu je důležitější mít správnou logiku než čísla.",
  "diff.3": "<b>Chrání vás před greenwashingem</b>Ne varováním v patičce, ale hodnoticími pravidly, která vyřazují „parádní“ metriky, a kontrolami, které zachytí známé chyby.",
  "diff.4": "<b>Bere nejistotu jako přednost</b>Být přesný v tom, nakolik si jste jistí, je poctivější a před mentorem, zákazníkem či investorem i přesvědčivější.",

  "not.h2": "Co tento nástroj není",
  "not.1": "<b>Není to úplné LCA.</b> Nenahrazuje hodnocení podle ISO 14040/14044.",
  "not.2": "<b>Není to komplexní výkaznictví skleníkových plynů.</b> Vestavěný odhad je orientační nástroj s obecnými emisními faktory. Před externím vykazováním je nahraďte národními faktory pro daný rok.",
  "not.3": "<b>Není to certifikace.</b> Vaše vstupy nikdo neaudituje. Důvěryhodnost stojí na transparentnosti metody a míry podloženosti.",
  "not.4": "<b>Není to skóre.</b> Na konci záměrně nevyjde žádné jedno číslo.",

  "faq.h2": "Otázky",
  "faq.1.q": "Jak dlouho to trvá?",
  "faq.1.a": "Na první průchod zhruba 45 až 60 minut. Kdykoli můžete přestat: postup se ukládá v tomto prohlížeči a pro pokračování na jiném zařízení si můžete stáhnout soubor s uloženým postupem.",
  "faq.2.q": "Kde jsou moje data uložena?",
  "faq.2.a": "Jen ve vašem prohlížeči. Nic z toho, co napíšete, se neodesílá na server; soubory se zprávou vznikají na vašem zařízení. Smazáním dat prohlížeče se uložený postup odstraní, proto si pro trvalou kopii stáhněte soubor JSON.",
  "faq.3.q": "Potřebuji pro začátek dokonalá data?",
  "faq.3.a": "Ne. Vezměte, co už máte: faktury za energie, kusovník, přehledy z cloudu, počty zákazníků. Upřímnost v tom, co nevíte, je důležitější než data, a nástroj je postavený tak, aby mezery ukázal, ne zakryl.",
  "faq.4.q": "Potřebuji environmentálního konzultanta?",
  "faq.4.a": "Ne. Otázky jsou psané srozumitelně a nástroj průběžně vysvětluje každý pojem. Na prvním kroku je panel s klíčovými pojmy a nic tu nepředpokládá znalosti z oblasti udržitelnosti.",
  "faq.5.q": "Nahrazuje to úplné LCA?",
  "faq.5.a": "Ne a ani to nepředstírá. Jde o orientační hodnocení, které vám dá strukturovaný a obhajitelný přehled o vašem dopadu. Nenahrazuje hodnocení podle ISO 14040/14044 ani komplexní výkaznictví skleníkových plynů.",
  "faq.6.q": "Můžu se k tomu později vrátit a aktualizovat to?",
  "faq.6.a": "Ano, a přesně tak je to myšleno. Na konci si stáhněte soubor JSON a nahrajte ho, až přijde další milník revize. Nástroj naváže tam, kde jste skončili, a automaticky vás posune do dalšího revizního cyklu.",
  "faq.7.q": "Vyjde na konci jedno skóre?",
  "faq.7.a": "Záměrně ne. Zúžit environmentální dopad na jedno číslo je přesně to, co dělá tvrzení o dopadu zavádějícími. Dostanete klasifikaci, cestu dopadu, cílenou sadu indikátorů a poctivé označení podloženosti u každého tvrzení.",
  "faq.8.q": "Můžu to napoprvé udělat špatně?",
  "faq.8.a": "Opravdu ne. Každou odpověď můžete později změnit a nic není zamčené. Jedinou skutečnou chybou je být méně upřímný, než jste mohli, a nástroj je postavený tak, aby to bylo těžší.",

  "close.h2": "Připraveni?",
  "close.p": "Vyplňte název startupu a odpovězte na první otázku. Všechno můžete později změnit a napoprvé to nejde udělat špatně.",
};
