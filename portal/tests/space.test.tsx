// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CONTRACTS } from "@junctura/health-contracts";
import { APPS } from "@junctura/health-demo/plan";
import chuyenTuyenXml from "@junctura/health-workflows/chuyen-tuyen.bpmn20.xml?raw";
import xacMinhChiPhiXml from "@junctura/health-workflows/xac-minh-chi-phi.bpmn20.xml?raw";
import xacMinhDonThuocXml from "@junctura/health-workflows/xac-minh-don-thuoc.bpmn20.xml?raw";
import { ContractDetailPage, ContractsPage, FacilitiesPage, SPACE_ROUTES, WorkflowsPage } from "../src/space";
import { CONTRACT_VIEWS, contractView, facilityView, parseWorkflow, WORKFLOWS } from "../src/space/data";
import { spaceStrings as s } from "../src/space/strings";

afterEach(() => vi.unstubAllGlobals());

describe("BPMN parsing", () => {
  const RAW_XML = [chuyenTuyenXml, xacMinhDonThuocXml, xacMinhChiPhiXml];

  it("parses all three workflow files into process id, name and ordered steps", () => {
    expect(WORKFLOWS).toHaveLength(3);
    expect(WORKFLOWS.map(workflow => workflow.id)).toEqual(["junctura_chuyen_tuyen", "junctura_xac_minh_don_thuoc", "junctura_xac_minh_chi_phi"]);
    for (const xml of RAW_XML) {
      const workflow = parseWorkflow(xml);
      expect(workflow.name.length).toBeGreaterThan(0);
      expect(workflow.steps[0]?.kind).toBe("startEvent");
      expect(workflow.steps.at(-1)?.kind).toBe("endEvent");
      for (const step of workflow.steps.slice(1, -1)) {
        expect(step.kind).toBe("userTask");
        expect(step.name.length).toBeGreaterThan(0);
        expect(step.groups.length).toBeGreaterThan(0);
      }
    }
  });

  it("keeps every step in flow order with the acting candidate groups", () => {
    for (const xml of RAW_XML) {
      const workflow = parseWorkflow(xml);
      expect(workflow.steps).toHaveLength(5); // start, three user tasks, end
      const userTasks = new DOMParser().parseFromString(xml, "application/xml").getElementsByTagName("userTask").length;
      expect(workflow.steps.filter(step => step.kind === "userTask")).toHaveLength(userTasks);
      const ids = workflow.steps.map(step => step.id);
      expect(new Set(ids).size).toBe(ids.length); // the walk never revisits a node
    }
    expect(WORKFLOWS.some(workflow => workflow.steps.some(step => step.groups.includes("tram-y-te")))).toBe(true);
    expect(WORKFLOWS.some(workflow => workflow.steps.some(step => step.groups.includes("nha-thuoc")))).toBe(true);
    expect(WORKFLOWS.some(workflow => workflow.steps.some(step => step.groups.includes("bao-hiem")))).toBe(true);
  });

  it("returns an empty workflow for input without a process", () => {
    expect(parseWorkflow("<definitions/>")).toEqual({ id: "", name: "", steps: [] });
  });
});

describe("contract data", () => {
  it("summarises every contract with flat input and output field lists", () => {
    expect(CONTRACT_VIEWS.map(view => view.slug)).toEqual(CONTRACTS.map(contract => contract.slug));
    for (const contract of CONTRACTS) {
      const view = contractView(contract.slug);
      expect(view).toBeTruthy();
      const fieldsOf = (schema: typeof contract.inputSchema) =>
        schema.type === "object"
          ? Object.entries(schema.properties).map(([name, field]) => ({
              name, type: field.type === "array" ? `array<${field.items.type}>` : field.type,
              required: schema.required.includes(name), description: field.description,
            }))
          : [];
      expect(view?.inputs).toEqual(fieldsOf(contract.inputSchema));
      expect(view?.outputs).toEqual(fieldsOf(contract.outputSchema));
      expect(view?.providerName).toBeTruthy();
      expect(view?.sideEffects).toBe(contract.sideEffects.description);
      expect(view?.timeoutMs).toBe(contract.timeoutMs);
    }
  });

  it("gives no view for an unknown slug", () => {
    expect(contractView("khong-ton-tai")).toBeUndefined();
  });

  it("lists every demo facility with the capabilities it provides and uses", () => {
    const facilities = facilityView();
    expect(facilities.map(facility => facility.appId).sort()).toEqual(APPS.map(app => app.name).sort());
    for (const facility of facilities) {
      expect(facility.provides.map(item => item.slug)).toEqual(CONTRACTS.filter(c => c.provider === facility.appId).map(c => c.slug));
      expect(facility.uses.map(item => item.slug)).toEqual(CONTRACTS.filter(c => c.consumers.includes(facility.appId as never)).map(c => c.slug));
    }
  });
});

describe("contracts list page", () => {
  it("shows every contract as a card linking to its detail route", () => {
    render(<ContractsPage />);
    for (const view of CONTRACT_VIEWS) {
      const link = document.querySelector<HTMLAnchorElement>(`a[href="#/hop-dong/${view.slug}"]`);
      expect(link?.textContent).toContain(view.title);
    }
    expect(screen.getByRole("heading", { name: s.contracts.title })).toBeTruthy();
  });
});

describe("contract detail page", () => {
  it.each(CONTRACTS.map(contract => contract.slug))("shows every field of %s", slug => {
    const contract = CONTRACTS.find(item => item.slug === slug);
    const view = contractView(slug);
    if (!contract || !view) throw new Error("missing contract");
    render(<ContractDetailPage slug={slug} />);
    expect(screen.getByRole("heading", { name: contract.title, level: 1 })).toBeTruthy();
    expect(screen.getByText(`${contract.timeoutMs} ms`)).toBeTruthy();
    expect(screen.getByText(contract.provider)).toBeTruthy();
    for (const name of contract.consumers) expect(screen.getByText(name)).toBeTruthy();
    for (const purpose of contract.purposes) expect(screen.getByText(purpose)).toBeTruthy();
    for (const side of [view.inputs, view.outputs]) {
      for (const field of side) {
        expect(screen.getAllByText(field.name).length).toBeGreaterThan(0);
        expect(screen.getAllByText(field.description ?? "—").length).toBeGreaterThan(0);
      }
    }
  });

  it("falls back to a not-found state for an unknown slug", () => {
    render(<ContractDetailPage slug="khong-ton-tai" />);
    expect(screen.getByText(s.contract.notFoundTitle)).toBeTruthy();
    expect(screen.getByText(s.contract.notFoundLead)).toBeTruthy();
    expect(screen.getByRole("button", { name: s.contract.backToList })).toBeTruthy();
  });
});

describe("workflows page", () => {
  it("lists the three workflows with numbered steps and acting groups", () => {
    render(<WorkflowsPage />);
    for (const workflow of WORKFLOWS) {
      expect(screen.getByRole("heading", { name: workflow.name })).toBeTruthy();
      expect(screen.getAllByText(`${workflow.steps.length} ${s.workflows.stepCount}`)).toHaveLength(WORKFLOWS.length);
    }
    expect(screen.getByText(`Nhóm thực hiện: Trạm y tế`)).toBeTruthy();
    expect(screen.getByText(`Nhóm thực hiện: Nhà thuốc`)).toBeTruthy();
    expect(screen.getByText(`Nhóm thực hiện: Bảo hiểm y tế`)).toBeTruthy();
    expect(screen.getAllByText(`Nhóm thực hiện: Bệnh viện`).length).toBe(6); // two hospital steps in each of the three flows
  });
});

describe("facilities page", () => {
  it("shows every facility with links to the contracts it provides and uses", () => {
    render(<FacilitiesPage />);
    for (const app of APPS) {
      expect(screen.getByRole("heading", { name: app.displayName })).toBeTruthy();
      const card = screen.getByText(app.displayName).closest("li");
      expect(card).toBeTruthy();
    }
    for (const view of CONTRACT_VIEWS) {
      expect(document.querySelector(`a[href="#/hop-dong/${view.slug}"]`)).toBeTruthy();
    }
  });
});

describe("routes", () => {
  it("exposes the three space routes", () => {
    expect(SPACE_ROUTES.map(route => route.path)).toEqual(["/hop-dong", "/quy-trinh", "/co-so"]);
    for (const route of SPACE_ROUTES) expect(route.label.length).toBeGreaterThan(0);
  });
});

describe("no network", () => {
  it("no space page calls fetch", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<ContractsPage />);
    render(<WorkflowsPage />);
    render(<FacilitiesPage />);
    for (const view of CONTRACT_VIEWS) render(<ContractDetailPage slug={view.slug} />);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
