package com.pokerchips.util

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class JoinTargetTest {

    @Test
    fun `a table code opens the online table, whatever the case`() {
        assertEquals("https://easypoker.cc/KAA29S", JoinTarget.parse("kaa29s"))
        assertEquals("https://easypoker.cc/KAA29S", JoinTarget.parse("  KAA29S \n"))
    }

    @Test
    fun `easypoker links are normalised to the table page`() {
        assertEquals("https://easypoker.cc/KAA29S", JoinTarget.parse("https://easypoker.cc/kaa29s"))
        assertEquals("https://easypoker.cc/KAA29S", JoinTarget.parse("easypoker.cc/KAA29S"))
        assertEquals("https://easypoker.cc/KAA29S", JoinTarget.parse("https://www.easypoker.cc/KAA29S#host=abc"))
        assertNull(JoinTarget.parse("https://easypoker.cc/"))
    }

    @Test
    fun `a wifi host link keeps scheme, address and port`() {
        assertEquals("http://192.168.1.20:8080/", JoinTarget.parse("http://192.168.1.20:8080"))
        assertEquals("http://192.168.1.20:8080/", JoinTarget.parse("192.168.1.20:8080/anything"))
    }

    @Test
    fun `nonsense is rejected`() {
        assertNull(JoinTarget.parse(""))
        assertNull(JoinTarget.parse("hello"))
        assertNull(JoinTarget.parse("ABC10O")) // 0, 1 and O are not in codes
        assertNull(JoinTarget.parse("javascript://alert(1)"))
    }

    @Test
    fun `online table codes are recognised in page urls`() {
        assertEquals("KAA29S", JoinTarget.onlineCode("https://easypoker.cc/KAA29S"))
        assertNull(JoinTarget.onlineCode("https://easypoker.cc/"))
        assertNull(JoinTarget.onlineCode("http://192.168.1.20:8080/"))
    }
}
