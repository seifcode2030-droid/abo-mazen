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
let isListening = false;
let recognition = null;

const MAX_HISTORY = 20;
const STORAGE_KEY = "translation_history";


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
// تحويل أكواد اللغات إلى TranslateAPI
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
        "</span>" +
        "<span>" +
        escapeHtml(String(message)) +
        "</span>";

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

    swapBtn.addEventListener(
        "click",
        function() {

            const src = sourceLangEl.value;
            const tgt = targetLangEl.value;

            sourceLangEl.value = tgt;
            targetLangEl.value = src;

            const oldSourceText = sourceText.value;
            const oldTargetText = targetText.value;

            sourceText.value = oldTargetText;
            targetText.value = oldSourceText;

            updateCharCount();

            // تحديث لغة التعرف الصوتي إذا كان موجودًا
            if (recognition) {
                recognition.lang = getSpeechLanguage();
            }

            showToast(
                "تم تبديل اللغات",
                "success"
            );
        }
    );
}


// ======================================================
// مسح النص
// ======================================================

if (clearBtn) {

    clearBtn.addEventListener(
        "click",
        function() {

            sourceText.value = "";
            targetText.value = "";

            updateCharCount();
        }
    );
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
// TranslateAPI
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
                    "Authorization": "Bearer " + TRANSLATE_API_KEY,

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

                errorMessage = data.detail;

            } else if (
                typeof data.error === "string"
            ) {

                errorMessage = data.error;

            } else if (
                typeof data.message === "string"
            ) {

                errorMessage = data.message;
            }
        }

        throw new Error(errorMessage);
    }

    // ----------------------------------------------
    // استخراج الترجمة
    // ----------------------------------------------

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

        for (
            const value of Object.values(translations)
        ) {

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

    if (!sourceText || !targetText) {
        return;
    }

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

    if (translateBtn) {
        translateBtn.disabled = true;
    }

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

        showToast(
            error.message ||
            "حدث خطأ أثناء الترجمة",
            "error"
        );

    } finally {

        isTranslating = false;

        if (translateBtn) {
            translateBtn.disabled = false;
        }

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
// MIC - لغة التعرف الصوتي
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

    return "wo-SN";
}


// ======================================================
// MIC - البحث عن الزر
// ======================================================

function findMicrophoneButton() {

    const ids = [
        "micBtn",
        "microphoneBtn",
        "micButton",
        "voiceBtn",
        "recordBtn",
        "startMicBtn"
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


let micButton =
    findMicrophoneButton();


// ======================================================
// MIC - إنشاء الزر إذا لم يكن موجودًا
// ======================================================

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

    sourceText.parentElement.appendChild(
        micButton
    );
}


// ======================================================
// MIC - تحديث شكل الزر
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
// MIC - إنشاء SpeechRecognition
// ======================================================

function setupSpeechRecognition() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {

        console.warn(
            "SpeechRecognition غير مدعوم"
        );

        return null;
    }

    const rec =
        new SpeechRecognition();

    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;


    // ----------------------------------------------
    // بدء التسجيل
    // ----------------------------------------------

    rec.onstart = function() {

        isListening = true;

        updateMicrophoneUI(true);

        showToast(
            "🎤 تحدث الآن...",
            "success"
        );
    };


    // ----------------------------------------------
    // استقبال الكلام
    // ----------------------------------------------

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

        if (finalText.trim()) {

            sourceText.value =
                finalText.trim();

            updateCharCount();

            setTimeout(
                function() {
                    performTranslation();
                },
                300
            );

        } else if (interimText.trim()) {

            sourceText.value =
                interimText.trim();

            updateCharCount();
        }
    };


    // ----------------------------------------------
    // خطأ
    // ----------------------------------------------

    rec.onerror = function(event) {

        console.error(
            "SpeechRecognition Error:",
            event.error
        );

        isListening = false;

        updateMicrophoneUI(false);

        if (event.error === "not-allowed") {

            showToast(
                "❌ الميكروفون غير مسموح للمتصفح",
                "error"
            );

        } else if (
            event.error === "no-speech"
        ) {

            showToast(
                "⚠️ لم يتم اكتشاف أي كلام",
                "warning"
            );

        } else if (
            event.error === "audio-capture"
        ) {

            showToast(
                "❌ تعذر الوصول إلى ميكروفون الهاتف",
                "error"
            );

        } else if (
            event.error === "language-not-supported"
        ) {

            showToast(
                "❌ المتصفح لا يدعم التعرف على هذه اللغة",
                "error"
            );

            console.error(
                "اللغة:",
                getSpeechLanguage()
            );

        } else {

            showToast(
                "❌ خطأ في التعرف الصوتي: " +
                event.error,
                "error"
            );
        }
    };


    // ----------------------------------------------
    // انتهاء التسجيل
    // ----------------------------------------------

    rec.onend = function() {

        isListening = false;

        updateMicrophoneUI(false);
    };


    return rec;
}


recognition =
    setupSpeechRecognition();


// ======================================================
// MIC - زر الميكروفون
// ======================================================

if (micButton) {

    micButton.addEventListener(
        "click",
        async function() {

            // ------------------------------------------
            // إيقاف التسجيل
            // ------------------------------------------

            if (isListening) {

                if (recognition) {
                    recognition.stop();
                }

                return;
            }


            // ------------------------------------------
            // التحقق من SpeechRecognition
            // ------------------------------------------

            if (!recognition) {

                showToast(
                    "❌ المتصفح لا يدعم التعرف على الكلام",
                    "error"
                );

                return;
            }


            // ------------------------------------------
            // طلب إذن الميكروفون
            // ------------------------------------------

            try {

                if (!navigator.mediaDevices ||
                    !navigator.mediaDevices.getUserMedia
                ) {

                    showToast(
                        "❌ الوصول إلى الميكروفون غير متاح",
                        "error"
                    );

                    return;
                }


                const stream =
                    await navigator.mediaDevices.getUserMedia({
                        audio: true
                    });


                // لا نحتاج إلى إبقاء الميكروفون مفتوحًا
                stream.getTracks().forEach(
                    function(track) {
                        track.stop();
                    }
                );


                // --------------------------------------
                // تحديد اللغة
                // --------------------------------------

                recognition.lang =
                    getSpeechLanguage();


                console.log(
                    "🎤 Speech language:",
                    recognition.lang
                );


                // --------------------------------------
                // بدء التعرف
                // --------------------------------------

                recognition.start();

            } catch (error) {

                console.error(
                    "Microphone Error:",
                    error
                );

                if (
                    error.name === "NotAllowedError" ||
                    error.name === "PermissionDeniedError"
                ) {

                    showToast(
                        "❌ اسمح للموقع باستخدام الميكروفون",
                        "error"
                    );

                } else if (
                    error.name === "NotFoundError"
                ) {

                    showToast(
                        "❌ لم يتم العثور على ميكروفون",
                        "error"
                    );

                } else {

                    showToast(
                        "❌ تعذر تشغيل الميكروفون: " +
                        error.name,
                        "error"
                    );
                }
            }
        }
    );
}


// ======================================================
// SPEAKER - النطق الصوتي
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
// SPEAKER - البحث عن زر النطق
// ======================================================

function findSpeakButton() {

    const ids = [
        "speakBtn",
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
// SPEAKER - إنشاء الزر إذا لم يكن موجودًا
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
// HISTORY - الحصول على السجل
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
// HISTORY - حفظ الترجمة
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
// HISTORY - مسح السجل
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
// HISTORY - عرض السجل
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

    history.forEach(
        function(item) {

            const div =
                document.createElement("div");

            div.className =
                "history-item";

            const source =
                escapeHtml(
                    String(
                        item.source || ""
                    )
                );

            const target =
                escapeHtml(
                    String(
                        item.target || ""
                    )
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
        }
    );
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
// تهيئة التطبيق
// ======================================================

renderHistory();
updateCharCount();


// ======================================================
// حالة الاتصال بالإنترنت
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
// معلومات تشخيصية
// ======================================================

console.log(
    "========================================"
);

console.log(
    "✅ مترجم Wolof ↔ العربية جاهز"
);

console.log(
    "🎤 SpeechRecognition:",
    recognition ?
    "متاح" :
    "غير مدعوم"
);

console.log(
    "🎤 getUserMedia:",
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia ?
    "متاح" :
    "غير متاح"
);

console.log(
    "🔊 speechSynthesis:",
    "speechSynthesis" in window ?
    "متاح" :
    "غير مدعوم"
);

console.log(
    "🔒 Secure Context:",
    window.isSecureContext
);

console.log(
    "========================================"
);