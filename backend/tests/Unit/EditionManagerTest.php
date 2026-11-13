<?php

namespace Tests\Unit;

use App\Edition\EditionManager;
use App\Edition\SaasEdition;
use App\Edition\StandaloneEdition;
use PHPUnit\Framework\TestCase;

class EditionManagerTest extends TestCase
{
    public function test_can_instantiate_standalone_edition(): void
    {
        $manager = new EditionManager('standalone', [
            'ai_assistant' => true,
            'multiple_storefronts' => false,
        ]);

        $this->assertInstanceOf(StandaloneEdition::class, $manager->getEdition());
        $this->assertTrue($manager->isStandalone());
        $this->assertFalse($manager->isMultiTenant());
        $this->assertFalse($manager->hasMasterControl());
        $this->assertTrue($manager->hasFeature('ai_assistant'));
    }

    public function test_can_instantiate_saas_edition(): void
    {
        $manager = new EditionManager('saas', [
            'ai_assistant' => true,
            'multiple_storefronts' => true,
        ]);

        $this->assertInstanceOf(SaasEdition::class, $manager->getEdition());
        $this->assertTrue($manager->isMultiTenant());
        $this->assertFalse($manager->isStandalone());
        $this->assertTrue($manager->hasMasterControl());
        $this->assertTrue($manager->hasFeature('multiple_storefronts'));
    }

    public function test_throws_exception_for_invalid_edition(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        new EditionManager('invalid_edition_name');
    }
}

