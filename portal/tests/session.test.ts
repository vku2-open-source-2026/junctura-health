// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { staffFor, usernameOf } from "../src/session";

const claimsOf = (claims: unknown): string =>
  btoa(JSON.stringify(claims)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

describe("staffFor", () => {
  it("maps the five staff roles to their facility", () => {
    expect(staffFor("ysi.tramyte")).toEqual({ username: "ysi.tramyte", displayName: "Y sĩ Lê Thị Hoa", facility: "tram-y-te" });
    expect(staffFor("bacsi.benhvien")).toEqual({ username: "bacsi.benhvien", displayName: "BS. Phạm Minh Quang", facility: "benh-vien" });
    expect(staffFor("duocsi.nhathuoc")).toEqual({ username: "duocsi.nhathuoc", displayName: "DS. Võ Thu Trang", facility: "nha-thuoc" });
    expect(staffFor("giamdinh.baohiem")).toEqual({ username: "giamdinh.baohiem", displayName: "Giám định viên Đỗ Quốc Hùng", facility: "bao-hiem" });
    expect(staffFor("quantri.soyte")).toEqual({ username: "quantri.soyte", displayName: "Quản trị Sở Y tế", facility: "so-y-te" });
  });
  it("returns null for patients and unknown usernames", () => {
    expect(staffFor("benhnhan.an")).toBeNull();
    expect(staffFor("benhnhan.p0050")).toBeNull();
    expect(staffFor("khong.ai")).toBeNull();
    expect(staffFor("")).toBeNull();
  });
});

describe("usernameOf", () => {
  it("reads preferred_username from the payload without verifying it", () => {
    const token = `header.${claimsOf({ sub: "abc", preferred_username: "quantri.soyte" })}.signature`;
    expect(usernameOf(token)).toBe("quantri.soyte");
  });
  it("returns null when the claim is missing or not a username", () => {
    expect(usernameOf(`header.${claimsOf({ sub: "abc" })}.signature`)).toBeNull();
    expect(usernameOf(`header.${claimsOf({ preferred_username: 42 })}.signature`)).toBeNull();
  });
  it("returns null for a broken token", () => {
    expect(usernameOf("not-a-jwt")).toBeNull();
    expect(usernameOf("only.two")).toBeNull();
    expect(usernameOf("header.%%%invalid%%%.signature")).toBeNull();
  });
});
