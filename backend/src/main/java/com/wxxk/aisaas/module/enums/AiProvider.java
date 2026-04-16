package com.wxxk.aisaas.module.enums;

/**
 * AI 공급자(Provider) 식별자.
 *
 * Module (무엇을 할 것인가) 과 Provider (누가 실행할 것인가) 를 분리한다.
 * AiModuleExecutor 구현체는 (moduleName, provider) 쌍으로 유일하게 식별된다.
 *
 * 새 공급자를 추가하려면:
 *   1. 이 enum 에 값을 추가한다.
 *   2. 해당 (module, provider) 조합을 위한 AiModuleExecutor 구현체를 작성한다.
 *   3. 그 외 어떤 클래스도 변경할 필요 없다.
 */
public enum AiProvider {
    OPENAI,
    GEMINI,
    CLAUDE,
    STABILITY_AI
}
