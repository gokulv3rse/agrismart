# ABSTRACT

Agriculture serves as the backbone of the global economy, yet it consistently faces significant threats from plant diseases and pest infestations. Timely and accurate detection of these agricultural threats is crucial to minimizing crop loss, optimizing resource utilization, and ensuring food security. Traditional visual inspection methods are labor-intensive, error-prone, and require specialized domain expertise that is often inaccessible to everyday farmers. To address these limitations, this project presents "AgriSmart"—an intelligent, end-to-end agricultural platform designed to automate plant disease and pest classification using deep learning, alongside active Internet of Things (IoT) intervention. 

The proposed system involves two primarily orchestrated components: a Deep Neural Network (DNN) core and a progressive web application dashboard. We trained a MobileNetV2 architecture on an optimized, balanced subset of 9,259 images curated from the PlantVillage dataset. Utilizing a two-phase training approach (frozen backbone transfer learning followed by fine-tuning) with weighted random sampling and Augmented Mixed Precision (AMP), the classification engine achieved a robust validation accuracy of 94.60% across multiple crop classes including Tomato, Potato, and Rice. 

Integrated directly into a secure, database-driven web dashboard (leveraging React, Vite, and Supabase), AgriSmart grants users the ability to seamlessly upload crop imagery, instantly receive diagnoses with confidence scoring, and track plant health over time. A deterministic rules engine maps these predictions to specific, actionable treatments—automatically generating scheduled spray tasks. Finally, an interactive IoT module calculates weather-based advisability for spraying and simulates automated pesticide and fertilizer releases, thereby bridging the gap between passive diagnostic artificial intelligence and active agricultural management. 

---

# CHAPTER 1
# INTRODUCTION

### 1.1 Overview
The global agricultural sector is under immense pressure to increase productivity while maintaining sustainability against the backdrop of dynamic climate shifts. Plant diseases and insect pests account for over 20-30% of global crop losses annually. In order to mitigate this, farmers often resort to prophylactic, uncalibrated use of pesticides and fertilizers. This not only exerts immense financial burden on the farmers but also leads to severe ecological consequences, including soil degradation, water table contamination, and loss of biodiversity.

Accurate identification of plant anomalies is the first step toward effective crop management. Traditionally, this required farmers to consult with agricultural extension workers or rely on rudimentary visual heuristics. However, recent advancements in Computer Vision (CV) and Deep Learning—specifically Convolutional Neural Networks (CNNs)—have demonstrated expert-level accuracy in categorizing complex visual patterns. AgriSmart harnesses these advancements, packaging them into an intuitive platform capable of delivering rapid, actionable agricultural intelligence to the edge.

### 1.2 Problem Statement
Existing agricultural support systems often exhibit massive disconnects between diagnostic phases and operative phases. While several deep learning models exist to classify plant diseases open-source datasets, they are severely bottlenecked by:
1. **Lack of Actionability**: Producing raw confidence scores without converting them into a tangible agricultural treatment plan.
2. **System Fragmentation**: Disconnectivity between the diagnosis of the disease and the subsequent task scheduling or IoT-guided sprinkling control.
3. **Black Box Architectures**: Dependence on external, non-transparent API endpoints preventing localized fine-tuning for specific crop variants.

### 1.3 Objectives
The primary objective of this project is to research, build, and evaluate a comprehensive smart agricultural ecosystem. The specific sub-objectives are:
1. **Model Optimization**: To train an efficient MobileNetV2 classifier on 9,259 properly stratified images covering healthy and diseased variants of Tomatoes, Potatoes, and Rice achieving an accuracy > 90%.
2. **Rules Engine Development**: To engineer a rules-based system that intercepts model predictions and maps them to deterministic actions (e.g., Pesticide dosage requirements, scheduling intervals).
3. **Platform Engineering**: To construct a minimal, clean, responsive dashboard using modern web technologies to process User Auth, History tracking, and Spraying task management.
4. **IoT Integration**: To incorporate simulated real-time telemetry representing fertilizer/pesticide levels, alongside localized weather condition querying to generate smart spray advisories.

---

# CHAPTER 2
# LITERATURE SURVEY

### 2.1 Deep Learning in Agriculture
Sladojevic et al. (2016) proposed an architecture utilizing CNNs for recognizing plant diseases from leaf images. Their model demonstrated the viability of classifying 13 different types of plant diseases, opening the doorway for automated visual symptom inspection. However, their system was purely diagnostic and did not include remediation steps.

### 2.2 Edge Deployable Convolutional Networks
Standard multi-layer perceptron models and massive networks like VGG16, while highly accurate, require substantial computational overhead that severely limits their deployment scaling on edge IoT sensors. Howard et al. (2017) introduced MobileNet, an efficient CNN architecture deploying depthwise separable convolutions that dramatically reduces parameter counts without significant accuracy forfeiture. AgriSmart utilizes the MobileNetV2 variation (Sandler et al., 2018), taking advantage of its inverted residual blocks to accelerate inference times during the `api/roboflow/infer` endpoint processing.

### 2.3 Integrated Precision Agriculture
Precision agriculture is transitioning from reactive observation to proactive algorithmic regulation. Boursianis et al. (2020) analyzed the integration of IoT within smart farming, emphasizing that closed-loop systems—where sensors directly communicate with decision engines to actuate physical responses—radically improve yield. AgriSmart emulates this architectural philosophy by directly wiring the deep learning output to the `api/iot/sprinkler/status` module.

*(Add citation list to the references section at the end of the report).*

---

# CHAPTER 3
# METHODOLOGY

### 3.1 Dataset Preparation
The system was trained utilizing an open-source subset of the prestigious PlantVillage dataset. Initially imbalanced, the dataset underwent rigid restructuring. A total of 9,259 images were sorted into highly deterministic class directories encompassing labels such as `Tomato___Bacterial_spot`, `Potato___Late_blight`, and `Rice___Brown_Spot`. To combat class imbalance during batching, a `WeightedRandomSampler` was written natively into the PyTorch continuous learning pipeline.

### 3.2 Model Selection and Augmentation
A pre-trained `MobileNetV2` model was selected as the base architecture. Transfer learning was utilized to hijack the feature extraction layers previously trained on ImageNet, appending a custom fully-connected classifier head outputting node probabilities matching our specific agricultural classes.

To improve robustness against real-world captures (differing lighting, off-center leaves), massive geometric augmentations were applied to the training dataset tensors:
- Random Horizontal and Vertical Flips (p=0.5)
- Random Rotations (up to 20 degrees)
- Color Jittering (Brightness, Contrast, Saturation)

### 3.3 Two-Phase Training Approach
The training loop was conducted under a precise two-stage fine-tuning methodology to prevent catastrophic forgetting:
1. **Phase 1 (Frozen Backbone):** The extensive feature-extraction layers of MobileNetV2 were locked. Only the dense classifier head iteratively updated its weights using CrossEntropyLoss over the first 15 epochs. 
2. **Phase 2 (Fine-Tuning):** The entire backbone was gently unfrozen, utilizing a drastically reduced learning rate scalar (1e-5), optimizing holistic network synergy for another 15 epochs.

### 3.4 Diagnostic API and Rules Mapping
The frontend UI allows authorized users to target specific hardware field plants. Upon uploading an image (`Home.tsx`), the image is securely ported to a Supabase bucket (`diagnosis-images`), generating a signed URL. The Node.js Express server queries the PyTorch inference module, capturing high-confidence softmax outputs.
A deterministic mapping checks the label against the `spray_recipes` database structure, immediately deriving:
- Spray Advisability (`boolean`)
- Action Type (`pesticide` | `fertilizer`)
- Interval configuration (`interval_days`)

*(Insert System Architecture IEEE Block Diagram Here)*

---

# CHAPTER 4
# IMPLEMENTATION & RESULTS

### 4.1 Training Performance Metrics
The PyTorch `MobileNetV2` refactoring significantly outperformed baseline benchmarks. The incorporation of a Class-Weighted Cross Entropy Loss dramatically recovered precision scores across minority dataset classes (like Rice diseases).

**Table 4.1: Model Progression Metrics**
| Metric | Baseline Prototype | AgriSmart V2 |
|--------|--------------------|--------------|
| Best Validation Accuracy | 60.42% | 94.60% |
| Dataset Size | 480 | 9,259 |
| Epochs | 10 | 30 |

*(Insert Training Curves line graph `training_curves.png` here: Caption - Fig 4.1: Validation and Training Loss across 30 Epochs)*

### 4.2 Class-Wise Performance Analysis
The confusion matrix revealed stellar clinical robustness. 
- **Tomato/Potato Classes**: Displayed F1 scores ranging exactly between **0.91 and 0.99**.
- **Rice Classes**: Displayed lower variance stabilization mostly due to extreme data sparsity (e.g. `Rice___Blast_Disease` containing under 20 images). 

*(Insert `confusion_matrix.png` here: Caption - Fig 4.2: Confusion Matrix evaluating Per-Class Performance)*

### 4.3 Web Dashboard Execution
The user interface was entirely upgraded to a pristine, modern aesthetic incorporating Inter typography, Emerald Green specific brand palettes, and flat high-contrast `BaseCard` rendering.
- **Home Interface**: Segmented execution of models is processed instantly. Drag-and-drop architecture dynamically previews the crop.
- **Weather API Integration**: `WeatherWidget.tsx` actively captures geolocated API parameters, cross-listing them against known spray-safety configurations.
- **Spray Task Automation**: Upon successful "Disease Detection", `SpraySchedule.tsx` initiates task grids marking out pesticide timelines which advance automatically upon "Mark Done".

*(Insert Screenshots of `Home.tsx` and `Analytics.tsx` UIs here)* 

---

# CHAPTER 5
# CONCLUSION & FUTURE WORK

### 5.1 Conclusion
The AgriSmart Intelligent Agriculture Platform successfully bridges the massive gap between experimental theoretical deep learning and end-user agritech software. By upgrading the pipeline to a custom-trained PyTorch MobileNetV2 architecture with weighted sampling, we resolved base inaccuracies, pushing the system capabilities bounds above the 94.60% confidence baseline.
Furthermore, engineering a responsive React/Vite dashboard directly plugged into Supabase PostgreSQL ensured that plant tracking, schedule administration, and IoT monitoring were securely scaled. 

### 5.2 Future Enhancements
While highly efficient, the system can benefit directly from:
1. **Dataset Extension**: Capturing indigenous real-world datasets regarding `Rice` variations would standardize the classification imbalance.
2. **Edge Hardware Actuation**: Translating the virtual IoT endpoints currently mapped on the NodeJS server onto physical Raspberry Pi modules directly communicating via physical MQTT signals.
3. **Advanced Detection**: Moving from single-image classification to semantic segmentation bounding boxes capable of dictating the precise surface area degradation percentage of a field capture.

---

# REFERENCES

[1] Sladojevic, S., Arsenovic, M., Anderla, A., Culibrk, D., & Stefanovic, D. (2016). Deep Neural Networks Based Recognition of Plant Diseases by Leaf Image Classification. Computational Intelligence and Neuroscience, 2016, 1-11.
[2] Howard, A. G., Zhu, M., Chen, B., Kalenichenko, D., Wang, W., Weyand, T., ... & Adam, H. (2017). MobileNets: Efficient Convolutional Neural Networks for Mobile Vision Applications. arXiv preprint arXiv:1704.04861.
[3] Sandler, M., Howard, A., Zhu, M., Zhmoginov, A., & Chen, L. C. (2018). MobileNetV2: Inverted Residuals and Linear Bottlenecks. In Proceedings of the IEEE conference on computer vision and pattern recognition (pp. 4510-4520).
[4] Boursianis, A. D., Papadopoulou, M. S., Diamantoulakis, P., Liopa-Tsakalidi, A., Barouchas, P., Salahas, G., ... & Goudos, S. K. (2020). Internet of Things (IoT) and Agricultural Unmanned Aerial Vehicles (UAVs) in smart farming: A comprehensive review. Internet of Things, 18, 100187.
[5] Mohanty, S. P., Hughes, D. P., & Salathé, M. (2016). Using deep learning for image-based plant disease detection. Frontiers in plant science, 7, 1419.
