// ======================================================
// TRANSLATE API TOKEN
// ======================================================

// ضع مفتاح TranslateAPI هنا
// يجب أن يبدأ بـ ta_
const TRANSLATE_API_KEY = "ta_626890611b31c6fce5f11b00880c1934ba4b228aa5565eaaa3025a38";


// ======================================================
// عناصر DOM
// ======================================================

const sourceLangEl = document.getElementById("sourceLang");
const targetLangEl = document.getElementById("targetLang");
const swapBtn = document.getElementById("swapLangBtn");

const sourceText = document.getElementById("sourceText");
const targetText = document.getElementById("targetText");

const translateBtn = document.getElementById("translateBtn");
const translateTextSpan = document.getElementById("translateText");
const loadingIndicator = document.getElementById("loadingIndicator");

const charCountSpan = document.getElementById("charCount");

const copyBtn = document.getElementById("copyBtn");
const clearBtn = document.getElementById("clearBtn");

const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

const toastContainer = document.getElementById("toastContainer");


// ======================================================
// حالة التطبيق
// ======================================================

let isTranslating = false;

const MAX_HISTORY = 20;
const STORAGE_KEY = "translation_history";


// ======================================================
// حالة الميكروفون
// ======================================================

let recognition = null;
let isListening = false;


// ======================================================
// أسماء اللغات
// ======================================================

function getLangLabel(code) {

    if (
        code === "wol_Latn" ||
        code === "wol" ||
        code === "wo"
    ) {
        return "Wolof";
    }

    if (
        code === "arb_Arab" ||
        code === "ara_Arab" ||
        code === "ar" ||
        code === "ara"
    ) {
        return "العربية";
    }

    return code;
}


// ======================================================
// تحويل أكواد اللغات
// ======================================================

function convertLanguageCode(code) {

    if (
        code === "wol_Latn" ||
        code === "wol" ||
        code === "wo"
    ) {
        return "wo";
    }

    if (
        code === "arb_Arab" ||
        code === "ara_Arab" ||
        code === "ar" ||
        code === "ara"
    ) {
        return "ar";
    }

    throw new Error(
        "اللغة غير مدعومة: " + code
    );
}


// ======================================================
// Toast
// ======================================================

function showToast(message, type = "success") {

    const icons = {
        success: "✅",
        error: "❌",
        warning: "⚠️"
    };

    if (!toastContainer) {
        console.log(message);
        return;
    }

    const toast = document.createElement("div");

    toast.className = "toast " + type;

    toast.innerHTML =
        '<span class="toast-icon">' +
        (icons[type] || "📢") +
        '</span>' +
        '<span>' +
        escapeHtml(String(message)) +
        '</span>';

    toastContainer.appendChild(toast);

    setTimeout(function() {

        toast.style.opacity = "0";
        toast.style.transform = "translateX(40px)";

        setTimeout(function() {
            toast.remove();
        }, 400);

    }, 4000);
}


// ======================================================
// عداد الأحرف
// ======================================================

function updateCharCount() {

    if (sourceText && charCountSpan) {
        charCountSpan.textContent =
            sourceText.value.length;
    }
}


if (sourceText) {

    sourceText.addEventListener(
        "input",
        updateCharCount
    );

}


// ======================================================
// تبديل اللغات
// ======================================================

if (swapBtn) {

    swapBtn.addEventListener("click", function() {

        const src = sourceLangEl.value;
        const tgt = targetLangEl.value;

        sourceLangEl.value = tgt;
        targetLangEl.value = src;

        const srcText = sourceText.value;
        const tgtText = targetText.value;

        sourceText.value = tgtText;
        targetText.value = srcText;

        updateCharCount();

        showToast(
            "تم تبديل اللغات",
            "success"
        );

    });

}


// ======================================================
// مسح النص
// ======================================================

if (clearBtn) {

    clearBtn.addEventListener("click", function() {

        sourceText.value = "";
        targetText.value = "";

        updateCharCount();

    });

}


// ======================================================
// نسخ الترجمة
// ======================================================

if (copyBtn) {

    copyBtn.addEventListener(
        "click",
        async function() {

            const text = targetText.value;

            if (!text) {

                showToast(
                    "لا توجد ترجمة لنسخها",
                    "warning"
                );

                return;
            }

            try {

                if (
                    navigator.clipboard &&
                    navigator.clipboard.writeText
                ) {

                    await navigator.clipboard.writeText(text);

                } else {

                    targetText.select();
                    document.execCommand("copy");

                }

                showToast(
                    "تم نسخ الترجمة إلى الحافظة",
                    "success"
                );

            } catch (error) {

                try {

                    targetText.select();
                    document.execCommand("copy");

                    showToast(
                        "تم نسخ الترجمة",
                        "success"
                    );

                } catch (copyError) {

                    showToast(
                        "تعذر نسخ الترجمة",
                        "error"
                    );

                }

            }

        }
    );

}


// ======================================================
// الترجمة باستخدام TranslateAPI
// ======================================================

async function translateText(
    text,
    sourceLang,
    targetLang
) {

    if (!text || !text.trim()) {
        throw new Error("النص فارغ");
    }


    if (!TRANSLATE_API_KEY ||
        TRANSLATE_API_KEY === "" ||
        TRANSLATE_API_KEY === "ta_ضع_مفتاحك_هنا"
    ) {

        throw new Error(
            "مفتاح TranslateAPI غير موجود"
        );

    }


    const source =
        convertLanguageCode(sourceLang);

    const target =
        convertLanguageCode(targetLang);


    console.log(
        "TranslateAPI source:",
        source
    );

    console.log(
        "TranslateAPI target:",
        target
    );


    if (source === target) {
        return text.trim();
    }


    let response;

    try {

        response = await fetch(
            "https://api.translateapi.ai/api/v1/translate/", {
                method: "POST",

                headers: {
                    "Authorization": "Bearer " +
                        TRANSLATE_API_KEY,

                    "Content-Type": "application/json",

                    "Accept": "application/json"
                },

                body: JSON.stringify({

                    text: text.trim(),

                    source_language: source,

                    target_language: target

                })
            }
        );

    } catch (networkError) {

        console.error(
            "TranslateAPI network error:",
            networkError
        );

        throw new Error(
            "تعذر الاتصال بخدمة الترجمة"
        );

    }


    let data;

    try {

        data = await response.json();

    } catch (jsonError) {

        console.error(
            "TranslateAPI JSON error:",
            jsonError
        );

        throw new Error(
            "استجابة API غير صالحة"
        );

    }


    console.log(
        "TranslateAPI status:",
        response.status
    );

    console.log(
        "TranslateAPI response:",
        data
    );


    if (!response.ok) {

        if (response.status === 401) {

            throw new Error(
                "مفتاح TranslateAPI غير صالح"
            );

        }


        if (response.status === 403) {

            throw new Error(
                "ليس لديك صلاحية لاستخدام TranslateAPI"
            );

        }


        if (response.status === 429) {

            throw new Error(
                "تم تجاوز حد الطلبات، حاول بعد قليل"
            );

        }


        let errorMessage =
            "HTTP " + response.status;


        if (data) {

            if (
                typeof data.detail === "string"
            ) {

                errorMessage =
                    data.detail;

            } else if (
                typeof data.error === "string"
            ) {

                errorMessage =
                    data.error;

            } else if (
                typeof data.message === "string"
            ) {

                errorMessage =
                    data.message;

            }

        }


        throw new Error(errorMessage);

    }


    if (
        data &&
        typeof data.translated_text === "string"
    ) {

        return data.translated_text.trim();

    }


    if (
        data &&
        data.data &&
        typeof data.data.translated_text === "string"
    ) {

        return data.data.translated_text.trim();

    }


    if (
        data &&
        typeof data.translation === "string"
    ) {

        return data.translation.trim();

    }


    if (
        data &&
        data.translations &&
        typeof data.translations === "object"
    ) {

        const translations =
            data.translations;


        if (
            typeof translations[target] === "string"
        ) {

            return translations[target].trim();

        }


        const values =
            Object.values(translations);


        for (const value of values) {

            if (
                typeof value === "string" &&
                value.trim()
            ) {

                return value.trim();

            }

        }

    }


    console.error(
        "لم يتم العثور على الترجمة:",
        data
    );


    throw new Error(
        "لم يتم العثور على الترجمة في استجابة API"
    );

}


// ======================================================
// تنفيذ الترجمة
// ======================================================

async function performTranslation() {

    const text =
        sourceText.value.trim();


    if (!text) {

        showToast(
            "الرجاء إدخال نص للترجمة",
            "warning"
        );

        return;

    }


    if (isTranslating) {
        return;
    }


    isTranslating = true;

    translateBtn.disabled = true;


    if (translateTextSpan) {

        translateTextSpan.textContent =
            "جاري الترجمة...";

    }


    if (loadingIndicator) {

        loadingIndicator.classList.remove(
            "hidden"
        );

    }


    const srcLang =
        sourceLangEl.value;

    const tgtLang =
        targetLangEl.value;


    try {

        const translation =
            await translateText(
                text,
                srcLang,
                tgtLang
            );


        targetText.value =
            translation;


        saveToHistory(
            text,
            translation,
            srcLang,
            tgtLang
        );


        renderHistory();


        showToast(
            "تمت الترجمة بنجاح",
            "success"
        );


    } catch (error) {

        console.error(
            "Translation Error:",
            error
        );


        let msg =
            error.message ||
            "حدث خطأ أثناء الترجمة";


        if (
            error.message === "النص فارغ"
        ) {

            msg =
                "النص فارغ، يرجى إدخال نص";

        }


        showToast(
            msg,
            "error"
        );

    } finally {

        isTranslating = false;

        translateBtn.disabled = false;


        if (translateTextSpan) {

            translateTextSpan.textContent =
                "ترجمة";

        }


        if (loadingIndicator) {

            loadingIndicator.classList.add(
                "hidden"
            );

        }

    }

}


// ======================================================
// زر الترجمة
// ======================================================

if (translateBtn) {

    translateBtn.addEventListener(
        "click",
        performTranslation
    );

}


// ======================================================
// الميكروفون
// ======================================================

function getSpeechLanguage() {

    const lang =
        sourceLangEl.value;


    if (
        lang === "arb_Arab" ||
        lang === "ara_Arab" ||
        lang === "ar" ||
        lang === "ara"
    ) {

        return "ar-SA";

    }


    // Wolof
    return "wo-SN";

}


// ======================================================
// إنشاء نظام التعرف على الكلام
// ======================================================

function setupSpeechRecognition() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (!SpeechRecognition) {

        console.warn(
            "Speech Recognition غير مدعوم في هذا المتصفح"
        );

        return null;

    }


    const rec =
        new SpeechRecognition();


    rec.continuous = false;

    rec.interimResults = true;

    rec.maxAlternatives = 1;


    rec.onstart = function() {

        isListening = true;

        updateMicrophoneUI(true);

        showToast(
            "🎤 تحدث الآن...",
            "success"
        );

    };


    rec.onresult = function(event) {

        let finalText = "";
        let interimText = "";


        for (
            let i = event.resultIndex; i < event.results.length; i++
        ) {

            const transcript =
                event.results[i][0].transcript;


            if (event.results[i].isFinal) {

                finalText += transcript;

            } else {

                interimText += transcript;

            }

        }


        if (finalText) {

            sourceText.value =
                finalText.trim();

            updateCharCount();

            // الترجمة تلقائيًا بعد الكلام
            setTimeout(function() {

                performTranslation();

            }, 300);

        } else if (interimText) {

            sourceText.value =
                interimText;

            updateCharCount();

        }

    };


    rec.onerror = function(event) {

        console.error(
            "Speech Recognition Error:",
            event.error
        );


        isListening = false;

        updateMicrophoneUI(false);


        if (event.error === "not-allowed") {

            showToast(
                "اسمح للمتصفح باستخدام الميكروفون",
                "error"
            );

        } else if (event.error === "no-speech") {

            showToast(
                "لم يتم اكتشاف أي كلام",
                "warning"
            );

        } else {

            showToast(
                "حدث خطأ في الميكروفون: " +
                event.error,
                "error"
            );

        }

    };


    rec.onend = function() {

        isListening = false;

        updateMicrophoneUI(false);

    };


    return rec;

}


recognition =
    setupSpeechRecognition();


// ======================================================
// العثور على زر الميكروفون
// ======================================================

function findMicrophoneButton() {

    const possibleIds = [

        "micBtn",
        "microphoneBtn",
        "micButton",
        "voiceBtn",
        "recordBtn",
        "startMicBtn",
        "speechBtn"

    ];


    for (const id of possibleIds) {

        const button =
            document.getElementById(id);


        if (button) {
            return button;
        }

    }


    return null;

}


const microphoneBtn =
    findMicrophoneButton();


// ======================================================
// إنشاء زر الميكروفون إذا لم يكن موجودًا
// ======================================================

let micButton = microphoneBtn;


if (!micButton && sourceText) {

    micButton =
        document.createElement("button");


    micButton.id =
        "micBtn";


    micButton.type =
        "button";


    micButton.textContent =
        "🎤";


    micButton.title =
        "التحدث بالميكروفون";


    micButton.setAttribute(
        "aria-label",
        "التحدث بالميكروفون"
    );


    // وضع الزر بعد مربع النص
    sourceText.parentElement.appendChild(
        micButton
    );

}


// ======================================================
// تحديث شكل زر الميكروفون
// ======================================================

function updateMicrophoneUI(active) {

    if (!micButton) {
        return;
    }


    if (active) {

        micButton.textContent =
            "⏹️";


        micButton.title =
            "إيقاف التسجيل";


        micButton.classList.add(
            "recording"
        );

    } else {

        micButton.textContent =
            "🎤";


        micButton.title =
            "التحدث بالميكروفون";


        micButton.classList.remove(
            "recording"
        );

    }

}



// ======================================================
// تشغيل / إيقاف الميكروفون مع طلب الإذن
// ======================================================

if (micButton) {

    micButton.addEventListener(
        "click",
        async function() {

            // إذا كان التسجيل يعمل → إيقافه
            if (isListening) {

                if (recognition) {
                    recognition.stop();
                }

                return;
            }


            // التحقق من دعم المتصفح
            if (!recognition) {

                showToast(
                    "المتصفح لا يدعم التعرف على الكلام",
                    "error"
                );

                return;
            }


            try {

                // ==========================================
                // طلب إذن استخدام الميكروفون
                // ==========================================

                if (navigator.mediaDevices &&
                    navigator.mediaDevices.getUserMedia) {

                    const stream =
                        await navigator.mediaDevices.getUserMedia({
                            audio: true
                        });

                    // حصلنا على الإذن، لا نحتاج إلى إبقاء
                    // الميكروفون مفتوحًا هنا
                    stream.getTracks().forEach(function(track) {
                        track.stop();
                    });

                }


                // ==========================================
                // تحديد لغة الكلام
                // ==========================================

                recognition.lang =
                    getSpeechLanguage();


                // ==========================================
                // تشغيل التعرف على الكلام
                // ==========================================

                recognition.start();


            } catch (error) {

                console.error(
                    "Microphone permission/start error:",
                    error
                );


                if (
                    error.name === "NotAllowedError" ||
                    error.name === "PermissionDeniedError"
                ) {

                    showToast(
                        "❌ يجب السماح للموقع باستخدام الميكروفون",
                        "error"
                    );

                } else if (
                    error.name === "NotFoundError"
                ) {

                    showToast(
                        "🎤 لم يتم العثور على ميكروفون",
                        "error"
                    );

                } else {

                    showToast(
                        "تعذر تشغيل الميكروفون",
                        "error"
                    );

                }

            }

        }
    );

}

navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
        alert("✅ الميكروفون يعمل");
        stream.getTracks().forEach(track => track.stop());
    })
    .catch(error => {
        alert("❌ " + error.name + "\n" + error.message);
        console.error(error);
    });



// ======================================================
// النطق الصوتي
// ======================================================

function speakTranslation() {

    const text =
        targetText.value.trim();


    if (!text) {

        showToast(
            "لا توجد ترجمة لنطقها",
            "warning"
        );

        return;

    }


    if (!("speechSynthesis" in window)) {

        showToast(
            "المتصفح لا يدعم النطق الصوتي",
            "error"
        );

        return;

    }


    window.speechSynthesis.cancel();


    const utterance =
        new SpeechSynthesisUtterance(text);


    const targetLang =
        targetLangEl.value;


    if (
        targetLang === "ar" ||
        targetLang === "ara" ||
        targetLang === "ara_Arab" ||
        targetLang === "arb_Arab"
    ) {

        utterance.lang =
            "ar-SA";

    } else {

        utterance.lang =
            "wo-SN";

    }


    utterance.rate = 0.9;

    utterance.pitch = 1;

    utterance.volume = 1;


    utterance.onerror = function() {

        showToast(
            "تعذر تشغيل النطق الصوتي",
            "error"
        );

    };


    window.speechSynthesis.speak(
        utterance
    );

}


// ======================================================
// العثور على زر النطق
// ======================================================

function findSpeakButton() {

    const ids = [

        "speakBtn",
        "speechBtn",
        "voiceOutputBtn",
        "readBtn",
        "listenBtn",
        "pronounceBtn"

    ];


    for (const id of ids) {

        const button =
            document.getElementById(id);


        if (button) {
            return button;
        }

    }


    return null;

}


let speakBtn =
    findSpeakButton();


// ======================================================
// إنشاء زر النطق إذا لم يكن موجودًا
// ======================================================

if (!speakBtn && targetText) {

    speakBtn =
        document.createElement("button");


    speakBtn.id =
        "speakBtn";


    speakBtn.type =
        "button";


    speakBtn.textContent =
        "🔊";


    speakBtn.title =
        "نطق الترجمة";


    speakBtn.setAttribute(
        "aria-label",
        "نطق الترجمة"
    );


    targetText.parentElement.appendChild(
        speakBtn
    );

}


if (speakBtn) {

    speakBtn.addEventListener(
        "click",
        speakTranslation
    );

}


// ======================================================
// LocalStorage - الحصول على السجل
// ======================================================

function getHistory() {

    try {

        const data =
            localStorage.getItem(
                STORAGE_KEY
            );


        if (!data) {
            return [];
        }


        const parsed =
            JSON.parse(data);


        if (!Array.isArray(parsed)) {
            return [];
        }


        return parsed;

    } catch (error) {

        console.error(
            "History error:",
            error
        );

        return [];

    }

}


// ======================================================
// حفظ ترجمة في السجل
// ======================================================

function saveToHistory(
    source,
    target,
    srcLang,
    tgtLang
) {

    let history =
        getHistory();


    const entry = {

        source: source,

        target: target,

        srcLang: srcLang,

        tgtLang: tgtLang,

        timestamp: Date.now()

    };


    history.unshift(entry);


    if (
        history.length >
        MAX_HISTORY
    ) {

        history =
            history.slice(
                0,
                MAX_HISTORY
            );

    }


    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(history)
        );

    } catch (error) {

        console.error(
            "LocalStorage error:",
            error
        );

    }

}


// ======================================================
// مسح السجل
// ======================================================

function clearHistory() {

    try {

        localStorage.removeItem(
            STORAGE_KEY
        );

    } catch (error) {

        console.error(
            "Clear history error:",
            error
        );

    }


    renderHistory();


    showToast(
        "تم مسح السجل",
        "success"
    );

}


if (clearHistoryBtn) {

    clearHistoryBtn.addEventListener(
        "click",
        function() {

            if (
                confirm(
                    "هل أنت متأكد من مسح كل سجل الترجمة؟"
                )
            ) {

                clearHistory();

            }

        }
    );

}


// ======================================================
// عرض السجل
// ======================================================

function renderHistory() {

    if (!historyList) {
        return;
    }


    const history =
        getHistory();


    historyList.innerHTML = "";


    if (history.length === 0) {

        historyList.innerHTML =
            '<p class="empty-history">' +
            "لا توجد ترجمات محفوظة." +
            "</p>";

        return;

    }


    history.forEach(function(item) {

        const div =
            document.createElement("div");


        div.className =
            "history-item";


        const source =
            escapeHtml(
                String(item.source || "")
            );


        const target =
            escapeHtml(
                String(item.target || "")
            );


        const srcLabel =
            escapeHtml(
                getLangLabel(
                    item.srcLang
                )
            );


        const tgtLabel =
            escapeHtml(
                getLangLabel(
                    item.tgtLang
                )
            );


        div.innerHTML =
            '<div class="h-source">' +
            source +
            "</div>" +

            '<div class="h-target">' +
            target +
            "</div>" +

            '<div class="h-lang">' +
            srcLabel +
            " → " +
            tgtLabel +
            "</div>";


        div.addEventListener(
            "click",
            function() {

                sourceText.value =
                    item.source || "";


                targetText.value =
                    item.target || "";


                sourceLangEl.value =
                    item.srcLang;


                targetLangEl.value =
                    item.tgtLang;


                updateCharCount();


                showToast(
                    "تم تحميل الترجمة السابقة",
                    "success"
                );

            }
        );


        historyList.appendChild(div);

    });

}


// ======================================================
// حماية HTML
// ======================================================

function escapeHtml(text) {

    const div =
        document.createElement("div");


    div.textContent =
        text;


    return div.innerHTML;

}


// ======================================================
// تهيئة السجل
// ======================================================

renderHistory();

updateCharCount();


// ======================================================
// حالة الاتصال
// ======================================================

window.addEventListener(
    "online",
    function() {

        showToast(
            "تم استعادة الاتصال بالإنترنت",
            "success"
        );

    }
);


window.addEventListener(
    "offline",
    function() {

        showToast(
            "انقطع الاتصال بالإنترنت، يرجى التحقق من شبكتك",
            "error"
        );

    }
);


// ======================================================
// Ctrl + Enter للترجمة
// ======================================================

if (sourceText) {

    sourceText.addEventListener(
        "keydown",
        function(e) {

            if (
                (e.ctrlKey || e.metaKey) &&
                e.key === "Enter"
            ) {

                e.preventDefault();

                performTranslation();

            }

        }
    );

}


// ======================================================
// جاهز
// ======================================================

console.log(
    "✅ مترجم Wolof ↔ العربية جاهز"
);

console.log(
    "🎤 نظام الميكروفون:",
    recognition ? "متاح" : "غير مدعوم"
);

console.log(
    "🔊 النطق الصوتي:",
    "speechSynthesis" in window ?
    "متاح" :
    "غير مدعوم"
);